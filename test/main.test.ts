import { toMatchImageSnapshot } from "jest-image-snapshot";

import MyWebpackTestCompiler from "./helpers/MyWebpackTestCompiler";

expect.extend({ toMatchImageSnapshot });

describe.each([4, 5] as const)("main", (webpackVersion) => {
  it("should compile with basic options", async () => {
    const compiler = new MyWebpackTestCompiler({ webpackVersion });
    const bundle = await compiler.compile({});

    expect(bundle.execute("main.js")).toMatchSnapshot();
    expect(
      await bundle.readAssetAsPNG("Macaca_nigra_self-portrait_large.jpg")
    ).toMatchImageSnapshot({
      customDiffConfig: { threshold: 0 },
      customSnapshotIdentifier: "Macaca_nigra_self-portrait_large",
    });
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
