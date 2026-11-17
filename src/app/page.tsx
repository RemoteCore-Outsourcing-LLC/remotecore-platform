import { readFileSync } from "node:fs";
import path from "node:path";

// Temporary: the demo home page, moved over as is.
// The real public pages replace this in the next step.
const home = readFileSync(path.join(process.cwd(), "src/content/home.html"), "utf8");

export default function Home() {
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: home }} />;
}
