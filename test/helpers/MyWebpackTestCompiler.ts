import path from "path";

import {
  CompileOptions,
  WebpackTestBundle,
  WebpackTestCompiler,
} from "../../src/index";

interface MyCompileOptions extends Omit<CompileOptions, "entryFilePath"> {
  entryFileName?: string;
}

export default class MyWebpackTestCompiler extends WebpackTestCompiler {
  compile(optioins: MyCompileOptions = {}): Promise<WebpackTestBundle> {
    const { entryFileName = "index.js", fileContentOverride } = optioins;
    const fixturesDir = path.resolve(__dirname, "..", "fixtures");

    this.webpackConfig = {
      context: fixturesDir,
      outputPath: path.resolve(__dirname, "..", "outputs"),
      rules: [
        {
          test: /\.(png|jpg|svg)/i,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
              },
            },
          ],
        },
        {
          test: /\.txt$/i,
          use: "raw-loader",
        },
      ],
    };

    return super.compile({
      entryFilePath: path.resolve(fixturesDir, entryFileName),
      fileContentOverride,
    });
  }
}
