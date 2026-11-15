import { getChain, inspectAddress, supportedChains } from "@/lib/blockchain"
import { tackle, type TackleHook, type TacklePool } from "@/lib/tackle"

export interface HookProvider { list(input:{page:number;limit:number;sort?:"pools"|"recent"}):Promise<{data:TackleHook[];total:number;page:number;limit:number}> }
export interface PoolProvider { list(input:{hook?:string;limit?:number;offset?:number}):Promise<{data:TacklePool[];total:number}> }
export interface TokenProvider { inspect(address:string,chainId:number):ReturnType<typeof inspectAddress> }
export interface NetworkProvider { list():{id:number;name:string;explorer:string|null}[] }
export interface QuoteProvider { quote(input:unknown):Promise<never> }

export const tackleHookProvider:HookProvider={async list({page,limit,sort="pools"}){const response=await tackle.hooks({limit,offset:(page-1)*limit,sort});return{data:response.hooks,total:response.total,page,limit}}}
export const tacklePoolProvider:PoolProvider={async list(input){const response=await tackle.pools({hook:input.hook,limit:input.limit??20,offset:input.offset??0});return{data:response.pools,total:response.total??response.pools.length}}}
export const rpcTokenProvider:TokenProvider={inspect:inspectAddress}
export const configuredNetworkProvider:NetworkProvider={list:()=>supportedChains.map(chain=>({id:chain.id,name:chain.name,explorer:getChain(chain.id)?.blockExplorers?.default?.url??null}))}
export const unavailableQuoteProvider:QuoteProvider={async quote(){throw new Error("QUOTE_PROVIDER_NOT_CONFIGURED")}}
