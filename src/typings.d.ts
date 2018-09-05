/* SystemJS module definition */
declare var module: NodeModule;
declare var watchingWallet: any;
declare var blockCypherProvider: any;
interface NodeModule {
  id: string;
}

declare module "*.json" {
  const value: any;
  export default value;
}
