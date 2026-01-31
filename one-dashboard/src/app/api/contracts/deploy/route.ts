import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:4000';

// Contract bytecode templates (pre-compiled Thirdweb contracts)
// In production, these would come from Thirdweb's contract registry
const CONTRACT_BYTECODES: Record<string, string> = {
  erc20: 'thirdweb:TokenERC20',
  erc721: 'thirdweb:TokenERC721',
  erc1155: 'thirdweb:TokenERC1155',
  'nft-drop': 'thirdweb:DropERC721',
  marketplace: 'thirdweb:Marketplace',
  vote: 'thirdweb:VoteERC20',
  split: 'thirdweb:Split',
  staking: 'thirdweb:Staking',
  airdrop: 'thirdweb:AirdropERC20',
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'E4010', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, chainId, projectId, params } = body;

    if (!templateId || !chainId || !projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'E4001', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const contractType = CONTRACT_BYTECODES[templateId];
    if (!contractType) {
      return NextResponse.json(
        { success: false, error: { code: 'E4002', message: 'Invalid contract template' } },
        { status: 400 }
      );
    }

    // Build constructor args based on template
    const constructorArgs = buildConstructorArgs(templateId, params);

    // Call Engine to deploy contract
    const response = await fetch(`${ENGINE_URL}/api/v1/contracts/deploy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
      body: JSON.stringify({
        chainId,
        contractType,
        name: params.name,
        symbol: params.symbol,
        constructorArgs,
        metadata: {
          templateId,
          params,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || { code: 'E5001', message: 'Deployment failed' }
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contractAddress: data.data?.contractAddress || data.contractAddress,
        transactionHash: data.data?.transactionHash || data.transactionHash,
        contractId: data.data?.contract?.id,
      },
    });
  } catch (error) {
    console.error('Contract deployment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function buildConstructorArgs(templateId: string, params: Record<string, any>): any[] {
  switch (templateId) {
    case 'erc20':
      return [
        params.name,
        params.symbol,
        params.initialSupply ? BigInt(params.initialSupply) * BigInt(10 ** (parseInt(params.decimals) || 18)) : BigInt(0),
        {
          mintable: params.mintable || false,
          burnable: params.burnable || false,
          pausable: params.pausable || false,
        },
      ];

    case 'erc721':
      return [
        params.name,
        params.symbol,
        params.baseUri || '',
        params.maxSupply ? parseInt(params.maxSupply) : 0,
        params.royaltyRecipient || '0x0000000000000000000000000000000000000000',
        params.royaltyBps ? parseInt(params.royaltyBps) * 100 : 0, // Convert % to bps
      ];

    case 'erc1155':
      return [
        params.name,
        params.symbol || '',
        params.baseUri || '',
        params.royaltyRecipient || '0x0000000000000000000000000000000000000000',
        params.royaltyBps ? parseInt(params.royaltyBps) * 100 : 0,
      ];

    case 'nft-drop':
      return [
        params.name,
        params.symbol,
        params.baseUri || '',
        parseInt(params.maxSupply) || 0,
        params.price ? BigInt(Math.floor(parseFloat(params.price) * 1e18)) : BigInt(0),
        parseInt(params.maxPerWallet) || 0,
        params.startTime ? Math.floor(new Date(params.startTime).getTime() / 1000) : 0,
        params.royaltyBps ? parseInt(params.royaltyBps) * 100 : 0,
      ];

    case 'marketplace':
      return [
        params.platformFeeRecipient,
        params.platformFeeBps ? Math.floor(parseFloat(params.platformFeeBps) * 100) : 0,
      ];

    case 'vote':
      return [
        params.name,
        params.tokenAddress,
        parseInt(params.votingDelay) || 1,
        parseInt(params.votingPeriod) || 45818,
        BigInt(params.proposalThreshold || 0),
        parseInt(params.quorumPercent) || 4,
      ];

    case 'split':
      const recipients = params.recipients || [];
      return [
        recipients.map((r: { address: string }) => r.address),
        recipients.map((r: { share: number }) => r.share * 100), // Convert % to bps
      ];

    case 'staking':
      return [
        params.stakingToken,
        params.rewardToken,
        BigInt(params.rewardRatio || 1),
        parseInt(params.lockDuration) || 0,
      ];

    case 'airdrop':
      return [
        params.tokenAddress,
        params.tokenType === 'ERC20' ? 0 : params.tokenType === 'ERC721' ? 1 : 2,
        params.merkleRoot || '0x0000000000000000000000000000000000000000000000000000000000000000',
      ];

    default:
      return [];
  }
}
