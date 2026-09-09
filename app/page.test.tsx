import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home placeholder", () => {
  it("renders brand and location", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("PKEE Constructions");
    expect(html).toContain("360 Keewatin St, Winnipeg, MB");
  });
});
