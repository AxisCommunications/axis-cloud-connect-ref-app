/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { makeStyles, tokens } from "@fluentui/react-components";
import type { ReactNode } from "react";

interface LayoutProps {
  readonly header: ReactNode;
  readonly navigation: ReactNode;
  readonly content: ReactNode;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
  },
  header: {
    width: "100%",
    zIndex: 1000,
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "48px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  body: {
    display: "flex",
    flexGrow: 1,
    overflow: "hidden",
    marginTop: "48px",
    height: "calc(100vh - 48px)",
  },
  navigation: {
    display: "flex",
    height: "100%",
    flexShrink: 0,
    overflow: "auto",
    position: "sticky",
    top: "48px",
  },
  content: {
    flexGrow: 1,
    overflow: "auto",
    padding: "1rem",
    backgroundColor: tokens.colorNeutralBackground1,
    position: "relative",
  },
});

export const Layout = ({ header, navigation, content }: LayoutProps) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>{header}</div>
      <div className={styles.body}>
        <div className={styles.navigation}>{navigation}</div>
        <div className={styles.content}>{content}</div>
      </div>
    </div>
  );
};
