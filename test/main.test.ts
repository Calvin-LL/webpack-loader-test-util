import crypto from "crypto";

import MyWebpackTestCompiler from "./helpers/MyWebpackTestCompiler";

describe.each([4, 5] as const)("main", (webpackVersion) => {
  it("should compile with basic options", async () => {
    const compiler = new MyWebpackTestCompiler({ webpackVersion });
    const bundle = await compiler.compile({});

    const pictureBuffer = await bundle.readAssetAsPNG(
      "Macaca_nigra_self-portrait_large.jpg"
    );
    const pictureHash = crypto
      .createHash("sha256")
      .update(pictureBuffer)
      .digest("hex");

    expect(bundle.execute("main.js")).toMatchSnapshot();
    expect(pictureHash).toMatchSnapshot();
  });

  it("should compile with file content override", async () => {
    const compiler = new MyWebpackTestCompiler({ webpackVersion });
    const bundle = await compiler.compile({ fileContent: "__export__ = 3" });

    expect(bundle.execute("main.js")).toMatchSnapshot();
  });

  it("should compile with specific file", async () => {
    const compiler = new MyWebpackTestCompiler({ webpackVersion });
    const bundle = await compiler.compile({ entryFileName: "anotherIndex.js" });

    expect(bundle.execute("main.js")).toMatchSnapshot();
  });
});
