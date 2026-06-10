iconst { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export interface ProposalInput {
  clientBrief: string
  yourRole: string
  dayRate: string
  approach: string
  timeline: string
  yourName: string
}

export interface ProposalResult {
  proposal: string
  wordCount: number
}

export async function generateProposal(input: ProposalInput): Promise<ProposalResult> {
  const prompt = `
You are an expert freelance proposal writer. Write a compelling, professional proposal based on the inputs below.

RULES:
- Write in first person from the freelancer's perspective
- Be specific about the client's problem — reference their brief directly
- Sound confident and human, not corporate or robotic
- Structure: Opening hook, Understanding of the brief, Your approach, Timeline, Investment (price), Next steps
- UK English spelling throughout
- No fluff, no filler — every sentence earns its place
- Length: 400-550 words

INPUTS:
Freelancer name: ${input.yourName}
Role/title: ${input.yourRole}
Day rate: ${input.dayRate}
Client brief: ${input.clientBrief}
Proposed approach: ${input.approach}
Estimated timeline: ${input.timeline}

Write the full proposal now. Return only the proposal text, no commentary.
`

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  const proposal = result.response.text()
  const wordCount = proposal.split(/\s+/).filter(Boolean).length

  return { proposal, wordCount }
}
