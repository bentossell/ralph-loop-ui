import { NextResponse } from 'next/server'

type GitHubLabel = {
	name: string
	color?: string
}

type GitHubIssue = {
	id: number
	number: number
	title: string
	body: string | null
	state: 'open' | 'closed'
	created_at: string
	updated_at: string
	labels: GitHubLabel[]
	pull_request?: unknown
}

type Activity = {
	icon: 'book' | 'search' | 'chat'
	label: string
	detail: string
}

type Tag = {
	label: string
	tone: 'blue' | 'green' | 'purple' | 'slate'
	icon?: 'branch' | 'check' | 'summary' | 'commit'
}

type Task = {
	id: string
	priority: 'LOW' | 'MEDIUM' | 'HIGH'
	group: string
	title: string
	description: string
	tags: Tag[]
}

type Column = {
	id: 'ready' | 'active' | 'review' | 'done'
	title: string
	count: number
	accent: string
	tasks: Task[]
}

type LoopResponse = {
	columns: Column[]
	activities: Activity[]
	currentTask: {
		title: string
		priority: Task['priority']
	}
	status: {
		state: 'Running' | 'Idle' | 'Paused'
		runningSince: string | null
		lastUpdate: string | null
	}
	logPreview: string
	logExpanded: string
	systemCount: number
}

type CreateIssuePayload = {
	title?: string
	body?: string
	priority?: Task['priority']
	labels?: string[]
}

const columnMeta = {
	ready: {
		title: 'Ready',
		accent: 'border-amber-300',
	},
	active: {
		title: 'Active',
		accent: 'border-blue-400',
	},
	review: {
		title: 'Review',
		accent: 'border-purple-400',
	},
	done: {
		title: 'Done',
		accent: 'border-emerald-400',
	},
} as const

const activityIcons: Activity['icon'][] = ['search', 'book', 'chat']
const priorityLabels: Record<Task['priority'], string> = {
	HIGH: 'p1',
	MEDIUM: 'p2',
	LOW: 'p3',
}

const formatTime = (value?: string | null) => {
	if (!value) {
		return null
	}

	return new Date(value).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	})
}

const getRepo = () => {
	const repoSlug = process.env.AGENT_LOOP_REPO ?? 'bentossell/agent-loop'
	const [owner, repo] = repoSlug.split('/')

	if (!owner || !repo) {
		throw new Error('Invalid AGENT_LOOP_REPO value')
	}

	return { owner, repo }
}

const getToken = () =>
	process.env.AGENT_LOOP_TOKEN || process.env.GITHUB_TOKEN

const githubFetch = async (path: string, init: RequestInit = {}) => {
	const token = getToken()
	if (!token) {
		throw new Error('Missing AGENT_LOOP_TOKEN or GITHUB_TOKEN')
	}

	const headers = new Headers(init.headers)
	if (!headers.has('Accept')) {
		headers.set('Accept', 'application/vnd.github+json')
	}
	headers.set('Authorization', `Bearer ${token}`)
	headers.set('X-GitHub-Api-Version', '2022-11-28')

	return fetch(`https://api.github.com${path}`, {
		...init,
		headers,
		cache: 'no-store',
	})
}

const normalizeLabels = (
	labels: string[] | undefined,
	priority: Task['priority'],
) => {
	const normalized = (labels ?? [])
		.map((label) => label.trim())
		.filter(Boolean)

	const priorityLabel = priorityLabels[priority]
	if (priorityLabel && !normalized.includes(priorityLabel)) {
		normalized.push(priorityLabel)
	}

	return Array.from(new Set(normalized)).slice(0, 10)
}

const labelMatch = (labels: string[], keywords: string[]) =>
	labels.some((label) => keywords.some((keyword) => label.includes(keyword)))

const pickColumn = (issue: GitHubIssue): Column['id'] => {
	const labels = issue.labels.map((label) => label.name.toLowerCase())

	if (labelMatch(labels, ['merged', 'done', 'completed', 'complete'])) {
		return 'done'
	}

	if (issue.state === 'closed') {
		return 'done'
	}

	if (
		labelMatch(labels, [
			'review',
			'in-review',
			'needs-review',
			'pr-open',
			'pull-request',
			'pr',
		])
	) {
		return 'review'
	}

	if (
		labelMatch(labels, [
			'active',
			'in-progress',
			'in progress',
			'doing',
			'running',
			'workflow',
		])
	) {
		return 'active'
	}

	if (labelMatch(labels, ['ready', 'todo', 'backlog'])) {
		return 'ready'
	}

	return issue.state === 'open' ? 'ready' : 'done'
}

const pickPriority = (labels: string[]) => {
	if (labelMatch(labels, ['p0', 'p1', 'high', 'urgent', 'critical'])) {
		return 'HIGH'
	}

	if (labelMatch(labels, ['p2', 'medium', 'normal'])) {
		return 'MEDIUM'
	}

	return 'LOW'
}

const pickGroup = (issue: GitHubIssue) => {
	const groupLabel = issue.labels.find((label) =>
		/^prd[-\s]?/i.test(label.name),
	)

	if (groupLabel) {
		return groupLabel.name.toUpperCase()
	}

	return `AL-${issue.number}`
}

const trimDescription = (body: string | null) => {
	const line = body?.split('\n').find((value) => value.trim())?.trim()

	if (!line) {
		return 'No description provided.'
	}

	if (line.length <= 120) {
		return line
	}

	return `${line.slice(0, 117)}...`
}

const pickTone = (label: GitHubLabel): Tag['tone'] => {
	const name = label.name.toLowerCase()

	if (labelMatch([name], ['bug', 'critical', 'urgent'])) {
		return 'purple'
	}

	if (labelMatch([name], ['done', 'ready', 'complete', 'approved'])) {
		return 'green'
	}

	if (labelMatch([name], ['feat', 'feature', 'enhancement'])) {
		return 'blue'
	}

	return 'slate'
}

const pickIcon = (label: GitHubLabel): Tag['icon'] | undefined => {
	const name = label.name.toLowerCase()

	if (labelMatch([name], ['feat', 'feature', 'branch'])) {
		return 'branch'
	}

	if (labelMatch([name], ['done', 'ready', 'complete', 'approved'])) {
		return 'check'
	}

	if (labelMatch([name], ['summary', 'spec'])) {
		return 'summary'
	}

	if (/^[0-9a-f]{6,}$/.test(name) || labelMatch([name], ['commit'])) {
		return 'commit'
	}

	return undefined
}

const buildTags = (issue: GitHubIssue): Tag[] =>
	issue.labels
		.filter((label) => label.name)
		.slice(0, 4)
		.map((label) => ({
			label: label.name,
			tone: pickTone(label),
			icon: pickIcon(label),
		}))

const buildTask = (issue: GitHubIssue): Task => {
	const labels = issue.labels.map((label) => label.name.toLowerCase())

	return {
		id: `issue-${issue.number}`,
		priority: pickPriority(labels),
		group: pickGroup(issue),
		title: issue.title,
		description: trimDescription(issue.body),
		tags: buildTags(issue),
	}
}

const buildLiveActivity = (
	columns: Column[],
	issues: GitHubIssue[],
): Activity[] => {
	const activeTask = columns.find((column) => column.id === 'active')?.tasks[0]
	if (activeTask) {
		return [
			{
				icon: activityIcons[0],
				label: 'Working',
				detail: activeTask.title,
			},
		]
	}

	const latest = issues.find((issue) => issue.state === 'open') ?? issues[0]
	if (!latest) {
		return [
			{
				icon: activityIcons[2],
				label: 'Idle',
				detail: 'No active tasks',
			},
		]
	}

	return [
		{
			icon: activityIcons[1],
			label: latest.state === 'closed' ? 'Recently closed' : 'Queued',
			detail: `#${latest.number} ${latest.title}`,
		},
	]
}

const buildColumns = (
	issues: GitHubIssue[],
	activeIssueNumber?: number | null,
): Column[] => {
	const tasks: Record<Column['id'], Task[]> = {
		ready: [],
		active: [],
		review: [],
		done: [],
	}

	issues.forEach((issue) => {
		const computed = pickColumn(issue)
		const column =
			computed === 'ready' &&
			activeIssueNumber &&
			issue.state === 'open' &&
			issue.number === activeIssueNumber
				? 'active'
				: computed
		tasks[column].push(buildTask(issue))
	})

	return (Object.keys(columnMeta) as Column['id'][]).map((id) => ({
		id,
		title: columnMeta[id].title,
		accent: columnMeta[id].accent,
		count: tasks[id].length,
		tasks: tasks[id],
	}))
}

const extractActiveIssueNumber = (progressText: string) => {
	const matches = Array.from(progressText.matchAll(/Issue #(\d+)/gi))
	if (!matches.length) {
		return null
	}

	const lastMatch = matches[matches.length - 1]
	const number = Number(lastMatch?.[1])
	return Number.isFinite(number) ? number : null
}

const buildCurrentTask = (columns: Column[]): LoopResponse['currentTask'] => {
	const activeTask = columns.find((column) => column.id === 'active')?.tasks[0]
	const readyTask = columns.find((column) => column.id === 'ready')?.tasks[0]
	const fallbackTask = columns[0]?.tasks[0]
	const task = activeTask ?? readyTask ?? fallbackTask

	return {
		title: task?.title ?? 'No open tasks',
		priority: task?.priority ?? 'LOW',
	}
}

const buildStatus = (issues: GitHubIssue[]): LoopResponse['status'] => {
	const openIssues = issues.filter((issue) => issue.state === 'open')
	const latestUpdate = issues[0]?.updated_at
	const oldestOpen = openIssues[openIssues.length - 1]?.created_at

	return {
		state: openIssues.length ? 'Running' : 'Idle',
		runningSince: formatTime(oldestOpen),
		lastUpdate: formatTime(latestUpdate),
	}
}

const buildLogs = (progressText: string, issues: GitHubIssue[]) => {
	const trimmed = progressText.trim()
	if (trimmed) {
		const lines = trimmed.split('\n')
		return {
			preview: lines.slice(0, 12).join('\n'),
			expanded: lines.slice(0, 120).join('\n'),
		}
	}

	const fallback = issues
		.slice(0, 6)
		.map((issue) => `#${issue.number} ${issue.title}`)
		.join('\n')

	return {
		preview: fallback || 'No progress yet.',
		expanded: fallback || 'No progress yet.',
	}
}

export async function GET() {
	try {
		const { owner, repo } = getRepo()
		const issuesPath =
			`/repos/${owner}/${repo}/issues?state=all&per_page=100&sort=updated`
		const issuesResponse = await githubFetch(issuesPath)

		if (!issuesResponse.ok) {
			const message = await issuesResponse.text()
			return NextResponse.json({ error: message }, { status: 500 })
		}

		const issues = (await issuesResponse.json()) as GitHubIssue[]
		const filteredIssues = issues.filter((issue) => !issue.pull_request)

		const progressResponse = await githubFetch(
			`/repos/${owner}/${repo}/contents/progress.txt`,
			{
				headers: {
					Accept: 'application/vnd.github.raw',
				},
			},
		)

		const progressText = progressResponse.ok
			? await progressResponse.text()
			: ''

		const activeIssueNumber = extractActiveIssueNumber(progressText)
		const columns = buildColumns(filteredIssues, activeIssueNumber)
		const logs = buildLogs(progressText, filteredIssues)

		const systemCount = filteredIssues.filter(
			(issue) => issue.state === 'open',
		).length

		const payload: LoopResponse = {
			columns,
			activities: buildLiveActivity(columns, filteredIssues),
			currentTask: buildCurrentTask(columns),
			status: buildStatus(filteredIssues),
			logPreview: logs.preview,
			logExpanded: logs.expanded,
			systemCount,
		}

		return NextResponse.json(payload)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const payload = (await request.json()) as CreateIssuePayload
		const title = payload.title?.trim() ?? ''
		if (!title) {
			return NextResponse.json(
				{ error: 'Title is required.' },
				{ status: 400 },
			)
		}

		const priority =
			payload.priority === 'HIGH' ||
			payload.priority === 'LOW' ||
			payload.priority === 'MEDIUM'
				? payload.priority
				: 'MEDIUM'
		const body = payload.body?.trim() ?? ''
		const labels = normalizeLabels(payload.labels, priority)

		const { owner, repo } = getRepo()
		const response = await githubFetch(`/repos/${owner}/${repo}/issues`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title,
				body,
				labels,
			}),
		})

		if (!response.ok) {
			const message = await response.text()
			return NextResponse.json({ error: message }, { status: response.status })
		}

		const issue = await response.json()
		return NextResponse.json({ issue })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
