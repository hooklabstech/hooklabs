import { ScannerForm } from "@/components/scanner-form"
export default async function ScannerPage({searchParams}:{searchParams:Promise<{address?:string;chainId?:string}>}){const params=await searchParams;return <ScannerForm initialAddress={params.address} initialChainId={params.chainId}/>}
