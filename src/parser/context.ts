import { ILogger } from "the-logger";
import { Promise } from "the-promise";

import {
  Handler,
  ProcessingTracker,
} from "@kubevious/helpers/dist/processing-tracker";

import { ConcreteRegistry } from "./concrete/registry";
import RemoteLoader from "./loaders/remote";

import { K8sParser } from "./parsers/k8s";
import { FacadeRegistry } from "./facade/registry";
import { WorldviousClient } from "@kubevious/worldvious-client";
import { DebugObjectLogger } from "./utils/debug-object-logger";

import { LogicProcessor } from "./logic/processor";

import { Context as BackendContext } from "../lib/context";

import VERSION from "../version";

export class Context {
  private _logger: ILogger;
  private _tracker: ProcessingTracker;
  private _loaders: any[] = [];
  private _concreteRegistry: ConcreteRegistry;
  private _k8sParser: K8sParser;
  private _logicProcessor: LogicProcessor;
  private _facadeRegistry: FacadeRegistry;
  private _worldvious: WorldviousClient;
  private _areLoadersReady = false;
  private _appContext: BackendContext;
  private _loaderInfo: { loader: RemoteLoader } | null;
  private _debugObjectLogger: DebugObjectLogger;

  constructor(logger: ILogger, appContext: BackendContext) {
    this._logger = logger.sublogger("ParserContext");
    this._appContext = appContext;
    this._loaderInfo = null;

    this._tracker = new ProcessingTracker(this.logger.sublogger("Tracker"));

    this._concreteRegistry = new ConcreteRegistry(this);
    this._k8sParser = new K8sParser(this);
    this._logicProcessor = new LogicProcessor(this);

    this._facadeRegistry = new FacadeRegistry(this);

    this._worldvious = new WorldviousClient(this._logger, "parser", VERSION);
    this._debugObjectLogger = new DebugObjectLogger(this);
  }

  get logger(): ILogger {
    return this._logger;
  }

  get tracker() {
    return this._tracker;
  }

  get concreteRegistry(): ConcreteRegistry {
    return this._concreteRegistry;
  }

  get facadeRegistry(): FacadeRegistry {
    return this._facadeRegistry;
  }

  get k8sParser(): K8sParser {
    return this._k8sParser;
  }

  get logicProcessor(): LogicProcessor {
    return this._logicProcessor;
  }

  get areLoadersReady(): boolean {
    return this._areLoadersReady;
  }

  get debugObjectLogger() {
    return this._debugObjectLogger;
  }

  get appContext() {
    return this._appContext;
  }

  get worldvious(): WorldviousClient {
    return this._worldvious;
  }

  init() {
    this.run();
    return Promise.resolve().then(() => this.facadeRegistry.init());
  }

  addLoader(loader: RemoteLoader) {
    var loaderInfo = {
      loader: loader,
      isReady: false,
      readyHandler: (value: boolean) => {
        loaderInfo.isReady = value;
        this._logger.debug("[readyHandler] %s", value);
        this._checkLoadersReady();
      },
    };
    loader.setupReadyHandler(loaderInfo.readyHandler);
    this._loaders.push(loaderInfo);
  }

  run() {
    this._setupTracker();

    return Promise.resolve()
      .then(() => this._worldvious.init())
      .then(() => this._processLoaders());
  }

  private _setupTracker() {
    if (process.env.NODE_ENV == "development") {
      this.tracker.enablePeriodicDebugOutput(10);
    } else {
      this.tracker.enablePeriodicDebugOutput(30);
    }

    this.tracker.registerListener((extractedData: Handler) => {
      this._worldvious.acceptMetrics(extractedData);
    });
  }

  private _processLoaders() {
    return Promise.serial(this._loaders, (x) => {
      return x.loader.run();
    });
  }

  private _checkLoadersReady() {
    var areLoadersReady = this._calculateLoadersReady();
    if (areLoadersReady != this._areLoadersReady) {
      this._areLoadersReady = areLoadersReady;
      this.logger.info(
        "[_checkLoadersReady] areLoadersReady: %s",
        areLoadersReady
      );

      if (this._areLoadersReady) {
        this.facadeRegistry.handleAreLoadersReadyChange();
      }
    }
  }

  private _calculateLoadersReady() {
    for (var loader of this._loaders) {
      if (!loader.isReady) {
        return false;
      }
    }
    return true;
  }

  activateLoader(config: any) {
    this._logger.debug("[activateLoader]", config);
    var loader = new RemoteLoader(this, config);

    this._loaderInfo = {
      loader: loader,
    };

    return Promise.resolve()
      .then(() => this._loaderInfo?.loader.run())
      .then(() => {
        return {
          success: true,
        };
      })
      .catch((reason) => {
        this.logger.error("Error connecting: ", reason);
        this.logger.error("Error connecting: ", reason.message);
        var messages = ["Unknown"];
        if (reason) {
          if (reason.messages) {
            messages = reason.messages;
          } else if (reason.message) {
            messages = [reason.message];
          }
        }
        return {
          success: false,
          messages: messages,
        };
      });
  }

  stopLoaders() {
    this._logger.debug("[stopLoaders]");
    if (this._loaderInfo) {
      this._loaderInfo.loader.stop();
      this.concreteRegistry.reset();
      this._loaderInfo = null;
    }
  }
}