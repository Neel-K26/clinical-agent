import { readFileSync } from "fs";
import path from "path";

export default function Home() {
  const html = readFileSync(
    path.join(process.cwd(), "public", "landing.html"),
    "utf-8"
  );

  const style = html.slice(
    html.indexOf("<style>") + "<style>".length,
    html.indexOf("</style>")
  );

  const bodyInner = html.slice(
    html.indexOf("<body>") + "<body>".length,
    html.indexOf("</body>")
  );

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <div dangerouslySetInnerHTML={{ __html: bodyInner }} />
    </>
  );
}
