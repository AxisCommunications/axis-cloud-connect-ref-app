/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { Recording } from "../types/recording";

// Layout constants
const TIMEBAR_BAR_Y = 2;
const TIMEBAR_BAR_HEIGHT = 16;
const TIMEBAR_TICK_Y = 18;
const TIMEBAR_TICK_HEIGHT = 7;
const TIMEBAR_LABEL_Y = 32;
const TIMEBAR_MIN_BAR_WIDTH = 1;

// Interaction constants
const ZOOM_INTENSITY = 0.1;
const FIT_RANGE_PADDING = 1.1; // 10% padding

// Display constants
const TARGET_TICK_COUNT = 10;
const TICK_FONT = "12px sans-serif";
const MAX_TICK_ITERATIONS = 1000;

// Color constants
const EVENT_RECORDING_COLOR = "#FF3B30";
const MANUAL_RECORDING_COLOR = "#444ebdff";
const RECORDING_OPACITY = 0.8;
const TICK_COLOR = "#0c0c0cff";

// Zoom limits
const MIN_VIEW_DURATION_MS = 1000; // 1 second
const MAX_VIEW_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Interactive timeline component for visualizing and navigating recordings.
 * Displays recording segments on a scrollable/zoomable timeline with playhead indicator.
 * Supports mouse dragging, scrolling to zoom, and click-to-seek functionality.
 */
export class Timebar {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private recordings: Recording[] = [];
  private currentTime: Date = new Date();
  private scale = 0.05; // pixels per millisecond - controls zoom level
  private onSeekCallback: ((time: Date) => void) | null = null;
  private isDragging = false;
  private lastMouseX = 0;
  private width = 0;
  private height = 0;
  // Event listener cleanup tracking
  private resizeHandler?: () => void;
  private mousedownHandler?: (e: MouseEvent) => void;
  private mousemoveHandler?: (e: MouseEvent) => void;
  private mouseupHandler?: (e: MouseEvent) => void;
  private wheelHandler?: (e: WheelEvent) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Apply container styles inline
    Object.assign(this.container.style, {
      position: "relative",
      width: "100%",
      height: "50px",
      backgroundColor: "#ffffff",
      border: "1px solid #1b1a1a",
      borderRadius: "4px",
      overflow: "hidden",
      userSelect: "none",
      marginTop: "10px",
    });

    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.container.appendChild(this.canvas);

    const context = this.canvas.getContext("2d");
    if (context === null) {
      throw new Error("Failed to get canvas context");
    }
    this.ctx = context;

    // Create playhead with inline styles
    const playhead = document.createElement("div");
    Object.assign(playhead.style, {
      position: "absolute",
      top: "0",
      left: "50%",
      width: "2px",
      height: "100%",
      backgroundColor: "#1a1a1b",
      pointerEvents: "none",
      zIndex: "10",
    });

    // Create playhead indicator (the circle at top)
    const playheadIndicator = document.createElement("div");
    Object.assign(playheadIndicator.style, {
      position: "absolute",
      top: "0",
      left: "-4px",
      width: "10px",
      height: "10px",
      backgroundColor: "#4a4a4c",
      borderRadius: "50%",
    });
    playhead.appendChild(playheadIndicator);

    this.container.appendChild(playhead);

    this.setupInteractions();
    this.resize();

    // Set initial scale to show about 10 minutes
    this.scale = this.width / (10 * 60 * 1000);
  }

  /**
   * Updates the list of recordings to display on the timeline.
   * @param recordings - Array of recording objects to visualize
   */
  public setRecordings(recordings: Recording[]) {
    this.recordings = recordings;
    this.draw();
  }

  /**
   * Updates the current playhead position.
   * @param time - The current playback time to display
   */
  public setCurrentTime(time: Date) {
    if (this.isDragging) {
      return;
    }
    this.currentTime = time;
    this.draw();
  }

  /**
   * Sets the callback function to be called when user seeks to a different time.
   * @param callback - Function to call with the new time when user clicks or drags on timeline
   */
  public setOnSeek(callback: (time: Date) => void) {
    this.onSeekCallback = callback;
  }

  /**
   * Automatically adjusts the timeline zoom and position to fit the given time range.
   * Adds 10% padding to ensure recordings are visible.
   *
   * IMPORTANT: This should only be called after the container is visible and has dimensions.
   * Call resize() first if needed to ensure width is calculated.
   *
   * @param start - Start time of the range to fit
   * @param end - End time of the range to fit
   */
  public fitToRange(start: Date, end: Date) {
    // Ensure we have dimensions
    if (this.width === 0) {
      this.resize();
      if (this.width === 0) {
        return;
      }
    }

    const duration = end.getTime() - start.getTime();
    if (duration <= 0) {
      return;
    }

    // Calculate scale to fit the duration in the width
    // Add padding for better visibility
    const paddedDuration = duration * FIT_RANGE_PADDING;
    this.scale = this.width / paddedDuration;

    // Center the view on the middle of the range
    const midTime = start.getTime() + duration / 2;
    this.currentTime = new Date(midTime);

    // Draw immediately with new scale and position
    this.draw();
  }

  public resize() {
    const rect = this.container.getBoundingClientRect();

    // Don't resize if container has no dimensions (hidden or not laid out)
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    this.width = rect.width;
    this.height = rect.height;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio ?? 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    // Reset transform and apply DPR scaling
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.draw();
  }

  private setupInteractions() {
    // Store handlers for cleanup
    this.resizeHandler = () => this.resize();

    this.mousedownHandler = (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.container.style.cursor = "grabbing";
    };

    this.mousemoveHandler = (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.lastMouseX;
        this.lastMouseX = e.clientX;

        // Move time: deltaX pixels -> deltaX / scale ms
        if (this.scale > 0) {
          const timeDelta = -deltaX / this.scale;
          this.currentTime = new Date(this.currentTime.getTime() + timeDelta);
          this.draw();
        }
      }
    };

    this.mouseupHandler = (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.container.style.cursor = "default";
        if (this.onSeekCallback) {
          this.onSeekCallback(this.currentTime);
        }
      } else {
        // Click to seek (only when the mouseup actually happens on the canvas).
        // Note: we listen on window to end drag even if mouseup occurs outside,
        // but we must NOT treat unrelated clicks (e.g. play/pause button) as seeks.
        if (this.scale <= 0) {
          return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const isInsideCanvas = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
        if (!isInsideCanvas) {
          return;
        }

        const viewDuration = this.width / this.scale;
        const startTime = this.currentTime.getTime() - viewDuration / 2;
        const clickTimeMs = startTime + x / this.scale;

        if (!Number.isNaN(clickTimeMs)) {
          this.currentTime = new Date(clickTimeMs);
          this.draw();
          if (this.onSeekCallback) {
            this.onSeekCallback(this.currentTime);
          }
        }
      }
    };

    // Wheel to zoom
    this.wheelHandler = (e) => {
      e.preventDefault();
      const wheel = e.deltaY < 0 ? 1 : -1;
      const zoom = Math.exp(wheel * ZOOM_INTENSITY);

      const newScale = this.scale * zoom;
      // Limit zoom
      const minScale = this.width / MAX_VIEW_DURATION_MS;
      const maxScale = this.width / MIN_VIEW_DURATION_MS;

      this.scale = Math.min(Math.max(newScale, minScale), maxScale);
      this.draw();
    };

    // Attach event listeners
    window.addEventListener("resize", this.resizeHandler);
    this.canvas.addEventListener("mousedown", this.mousedownHandler);
    window.addEventListener("mousemove", this.mousemoveHandler);
    window.addEventListener("mouseup", this.mouseupHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler, { passive: false });
  }

  private draw() {
    const width = this.width;
    const height = this.height;

    // Silently return if no dimensions yet - this is normal during initialization
    if (width === 0 || height === 0) {
      return;
    }

    this.ctx.clearRect(0, 0, width, height);

    if (this.scale <= 0) {
      return;
    }

    // Calculate view range
    const viewDuration = width / this.scale;
    const startTime = this.currentTime.getTime() - viewDuration / 2;
    const endTime = this.currentTime.getTime() + viewDuration / 2;

    // Draw ticks
    this.drawTicks(startTime, endTime);

    // Draw recordings
    if (this.recordings.length === 0) {
      return;
    }

    this.recordings.forEach((recording) => {
      const rStart = recording.startTime.getTime();
      const rEnd = recording.stopTime.getTime();

      // Check overlap
      if (rEnd < startTime || rStart > endTime) {
        return;
      }

      const xStart = (rStart - startTime) * this.scale;
      const xEnd = (rEnd - startTime) * this.scale;
      const w = Math.max(xEnd - xStart, TIMEBAR_MIN_BAR_WIDTH);

      // Draw segment
      // Color logic: Red if eventId is present, Blue otherwise
      const isEvent = recording.eventId.trim() !== "";

      this.ctx.fillStyle = isEvent ? EVENT_RECORDING_COLOR : MANUAL_RECORDING_COLOR;

      this.ctx.globalAlpha = RECORDING_OPACITY;
      this.ctx.fillRect(xStart, TIMEBAR_BAR_Y, w, TIMEBAR_BAR_HEIGHT);
      this.ctx.globalAlpha = 1.0;
    });
  }

  private drawTicks(startTime: number, endTime: number) {
    const duration = endTime - startTime;
    if (duration <= 0 || Number.isNaN(duration)) {
      return;
    }

    // Determine tick interval
    // We want about TARGET_TICK_COUNT ticks
    const rawInterval = duration / TARGET_TICK_COUNT;

    // Find nice interval
    const intervals = [
      1000, // 1s
      5000, // 5s
      10000, // 10s
      30000, // 30s
      60000, // 1m
      300000, // 5m
      600000, // 10m
      1800000, // 30m
      3600000, // 1h
      7200000, // 2h
      14400000, // 4h
    ];

    let interval = intervals[intervals.length - 1];
    for (const intv of intervals) {
      if (rawInterval < intv) {
        interval = intv;
        break;
      }
    }

    if (interval <= 0) {
      return;
    }

    // Find first tick
    const firstTick = Math.ceil(startTime / interval) * interval;

    // Safety check to prevent infinite loop if firstTick is way off
    if (Number.isNaN(firstTick)) {
      return;
    }

    this.ctx.fillStyle = TICK_COLOR;
    this.ctx.font = TICK_FONT;
    this.ctx.textAlign = "center";

    // Limit max iterations to prevent hang
    let iterations = 0;

    for (let t = firstTick; t <= endTime; t += interval) {
      iterations++;
      if (iterations > MAX_TICK_ITERATIONS) {
        break;
      }

      const x = (t - startTime) * this.scale;

      // Draw tick line
      this.ctx.fillRect(x, TIMEBAR_TICK_Y, 2, TIMEBAR_TICK_HEIGHT);

      // Draw label below tick
      const date = new Date(t);
      let label = "";
      if (interval < 60000) {
        label = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } else {
        label = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }

      this.ctx.fillText(label, x, TIMEBAR_LABEL_Y);
    }
  }

  /**
   * Cleans up event listeners and resources.
   * Call this method when the timeline is no longer needed to prevent memory leaks.
   */
  public destroy() {
    // Remove all event listeners
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    if (this.mousedownHandler) {
      this.canvas.removeEventListener("mousedown", this.mousedownHandler);
    }
    if (this.mousemoveHandler) {
      window.removeEventListener("mousemove", this.mousemoveHandler);
    }
    if (this.mouseupHandler) {
      window.removeEventListener("mouseup", this.mouseupHandler);
    }
    if (this.wheelHandler) {
      this.canvas.removeEventListener("wheel", this.wheelHandler);
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Remove DOM elements
    this.container.innerHTML = "";
  }
}
