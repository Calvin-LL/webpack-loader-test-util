import { Options } from "file-loader";
import path from "path";

import {
  CompileOptions,
  WebpackTestBundle,
  WebpackTestCompiler,
} from "../../src/index";

interface MyCompileOptions extends Omit<CompileOptions, "entryFilePath"> {
  entryFileName?: string;
  fileLoaderOptions?: Options;
}

export default class MyWebpackTestCompiler extends WebpackTestCompiler {
  compile(optioins: MyCompileOptions = {}): Promise<WebpackTestBundle> {
    const { entryFileName = "index.js", fileLoaderOptions } = optioins;
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
                ...fileLoaderOptions,
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
      ...optioins,
      entryFilePath: path.resolve(fixturesDir, entryFileName),
    });
  }
}
