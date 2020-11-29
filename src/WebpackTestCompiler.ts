import fs from "fs";
import { DirectoryJSON, IFs, Volume, createFsFromVolume } from "memfs";
import path from "path";
import webpack from "webpack";
import webpack5 from "webpack5";

import { WebpackTestBundle } from "./WebpackTestBundle";

interface WebpackConfig {
  rules: Required<webpack.Configuration>["module"]["rules"];
  context?: Required<webpack.Configuration>["context"];
  outputPath?: Required<webpack.Configuration>["output"]["path"];
}

interface Options {
  webpackVersion: 4 | 5;
  webpackConfig?: WebpackConfig;
  overrideFiles?: DirectoryJSON;
}

export interface CompileOptions {
  entryFilePath: string;
  fileContentOverride?: string;
  throwOnError?: boolean;
}

export class WebpackTestCompiler {
  readonly webpackVersion: Options["webpackVersion"];
  webpackConfig: Required<Options>["webpackConfig"];
  overrideFiles: Required<Options>["overrideFiles"];

  constructor({
    webpackVersion = 4,
    webpackConfig = { rules: [] },
    overrideFiles = {},
  }: Options) {
    this.webpackVersion = webpackVersion;
    this.webpackConfig = webpackConfig;
    this.overrideFiles = overrideFiles;
  }

  getWebpackConfig(entryFilePath: string): webpack.Configuration {
    const { rules, context, outputPath } = this.webpackConfig;

    return {
      mode: "production",
      devtool: false,
      context: context,
      entry: entryFilePath,
      output: {
        publicPath: "",
        path: outputPath,
        filename: "[name].js",
      },
      module: {
        rules: rules,
      },
      optimization: {
        minimize: false,
      },
    };
  }

  compile({
    entryFilePath,
    fileContentOverride,
    throwOnError = true,
  }: CompileOptions): Promise<WebpackTestBundle> {
    if (fileContentOverride !== undefined)
      this.overrideFiles[entryFilePath] = fileContentOverride;

    const compiler = this.getCompiler(entryFilePath);

    return new Promise((resolve, reject) => {
      compiler.run((error, stats) => {
        const returnResult = (): void => {
          if (error) reject(error);
          else if (throwOnError && stats.hasErrors())
            reject(stats.compilation.errors);
          else {
            const bundle = new WebpackTestBundle({
              webpackVersion: this.webpackVersion,
              stats,
              compiler,
            });

            resolve(bundle);
          }
        };

        if (this.webpackVersion === 5)
          // @ts-expect-error using typing from webpack@4 which doesn't have compiler.close
          compiler.close(returnResult);
        else returnResult();
      });
    });
  }

  private getCompiler(entryFilePath: string): webpack.Compiler {
    const wp = (this.webpackVersion === 5
      ? webpack5
      : webpack) as typeof webpack;
    const compiler = wp(this.getWebpackConfig(entryFilePath));

    const vol = new Volume();
    const virtualFileSystem = createFsFromVolume(vol) as IFs & {
      join: typeof path.join;
    };

    virtualFileSystem.join = path.join.bind(path);

    if (this.overrideFiles && Object.keys(this.overrideFiles).length !== 0) {
      const fakeFs = { ...fs };

      WebpackTestCompiler.overrideReadFiles(
        fakeFs,
        vol,
        virtualFileSystem,
        this.overrideFiles
      );

      compiler.inputFileSystem = fakeFs;
    }

    compiler.outputFileSystem = virtualFileSystem;

    return compiler;
  }

  private static overrideReadFiles(
    fakeFs: typeof fs,
    vol: InstanceType<typeof Volume>,
    virtualFileSystem: IFs,
    overrideFiles: Required<Options>["overrideFiles"]
  ): void {
    vol.fromJSON(overrideFiles);

    const pathsToOverride = Object.keys(overrideFiles);

    const fsReadFile = fakeFs.readFile;
    const fsReadFileSync = fakeFs.readFileSync;

    // @ts-expect-error typescript doesn't like overriding imported functions
    fakeFs.readFile = function (path: string) {
      if (pathsToOverride.includes(path))
        // @ts-expect-error this function's arguments' types are ambiguous
        // eslint-disable-next-line prefer-rest-params
        return virtualFileSystem.readFile.apply(null, arguments);

      // @ts-expect-error this function's arguments' types are ambiguous
      // eslint-disable-next-line prefer-rest-params, prefer-spread
      return fsReadFile.apply(null, arguments);
    };

    // @ts-expect-error typescript doesn't like overriding imported functions
    fakeFs.readFileSync = function (path) {
      if (pathsToOverride.includes(path))
        // @ts-expect-error this function's arguments' types are ambiguous
        // eslint-disable-next-line prefer-rest-params
        return virtualFileSystem.readFileSync.apply(null, arguments);

      // @ts-expect-error this function's arguments' types are ambiguous
      // eslint-disable-next-line prefer-rest-params, prefer-spread
      return fsReadFileSync.apply(null, arguments);
    };
  }
}
