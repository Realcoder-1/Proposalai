import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
  })

  const proposal = response.choices[0].message.content || ''
  const wordCount = proposal.split(/\s+/).filter(Boolean).length

  return { proposal, wordCount }
}
