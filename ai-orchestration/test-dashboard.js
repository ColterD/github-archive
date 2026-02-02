// Test script to validate dashboard is fetching GitHub data correctly
const GITHUB_TOKEN = 'REDACTED';
const GITHUB_REPO = 'ColterD/AI_Orchestration';
const GITHUB_API_BASE = 'https://api.github.com';

async function testGitHubAPI() {
  console.log('\n🔍 Testing GitHub API Integration...\n');
  
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/pulls?state=all&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      }
    );
    
    if (!response.ok) {
      console.error(`❌ GitHub API error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const prs = await response.json();
    console.log(`✅ Total PRs fetched: ${prs.length}`);
    
    // Filter agent PRs
    const agentPRs = prs.filter(pr => {
      const login = pr.user?.login?.toLowerCase() || '';
      const type = pr.user?.type || '';
      return login === 'copilot' || type === 'Bot';
    });
    
    console.log(`✅ Agent PRs found: ${agentPRs.length}\n`);
    console.log('⏳ Fetching detailed info for each PR...\n');
    
    // Fetch details for each PR
    const detailedPRs = await Promise.all(
      agentPRs.slice(0, 5).map(async (pr) => {
        const detailResponse = await fetch(
          `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/pulls/${pr.number}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `token ${GITHUB_TOKEN}`
            }
          }
        );
        return await detailResponse.json();
      })
    );
    
    // Show first 5
    console.log('📋 Recent Agent PRs:');
    detailedPRs.forEach(pr => {
      console.log(`  #${pr.number}: ${pr.title}`);
      console.log(`    State: ${pr.state}, Author: ${pr.user.login}`);
      console.log(`    +${pr.additions || 0} -${pr.deletions || 0} lines (${pr.changed_files} files)\n`);
    });
    
    // Calculate metrics from all PRs
    const allDetails = await Promise.all(
      agentPRs.map(async (pr) => {
        const detailResponse = await fetch(
          `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/pulls/${pr.number}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `token ${GITHUB_TOKEN}`
            }
          }
        );
        return await detailResponse.json();
      })
    );
    
    const openPRs = allDetails.filter(pr => pr.state === 'open').length;
    const totalAdditions = allDetails.reduce((sum, pr) => sum + (pr.additions || 0), 0);
    const totalDeletions = allDetails.reduce((sum, pr) => sum + (pr.deletions || 0), 0);
    
    console.log('📊 Metrics:');
    console.log(`  Total PRs: ${allDetails.length}`);
    console.log(`  Open PRs: ${openPRs}`);
    console.log(`  Total Additions: ${totalAdditions.toLocaleString()}`);
    console.log(`  Total Deletions: ${totalDeletions.toLocaleString()}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGitHubAPI();
