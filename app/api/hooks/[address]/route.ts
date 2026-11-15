import { NextResponse } from "next/server"
import { isAddress } from "viem"
import { tacklePoolProvider } from "@/lib/providers"
export async function GET(_request:Request,{params}:{params:Promise<{address:string}>}){const{address}=await params;if(!isAddress(address))return NextResponse.json({error:"Invalid EVM address"},{status:400});try{const pools=await tacklePoolProvider.list({hook:address,limit:20,offset:0});const hook=pools.data[0]?.hook??{address};return NextResponse.json({data:{...hook,address,pools:pools.data,poolsTotal:pools.total},provider:"tacklehooks.xyz",chainId:4663},{headers:{"Cache-Control":"public, s-maxage=20, stale-while-revalidate=60"}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Hook unavailable"},{status:502})}}
