import { NextResponse } from "next/server"
import { readCheckpoint } from "@/lib/indexer-db"
import { tackle } from "@/lib/tackle"
export async function GET(){try{const [source,mirror]=await Promise.all([tackle.stats(),readCheckpoint()]);return NextResponse.json({ok:source.index.indexedThroughBlock===source.index.headBlock,source:{provider:"tacklehooks.xyz",...source.index},mirror:mirror??{status:"not-started",indexed_records:0},checkedAt:new Date().toISOString()},{headers:{"Cache-Control":"public, s-maxage=20, stale-while-revalidate=40"}})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Health unavailable"},{status:503})}}
