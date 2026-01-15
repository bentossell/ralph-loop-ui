'use client'

import {
	type FormEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'

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
	id: string
	title: string
	count: number
	accent: string
	tasks: Task[]
}

type LoopStatus = {
	state: 'Running' | 'Idle' | 'Paused'
	runningSince: string | null
	lastUpdate: string | null
}

type LoopResponse = {
	columns: Column[]
	activities: Activity[]
	currentTask: {
		title: string
		priority: Task['priority']
	}
	status: LoopStatus
	logPreview: string
	logExpanded: string
	systemCount: number
}

const emptyData: LoopResponse = {
	activities: [],
	columns: [],
	currentTask: {
		title: 'No active task',
		priority: 'LOW',
	},
	status: {
		state: 'Idle',
		runningSince: null,
		lastUpdate: null,
	},
	logPreview: 'No progress yet.',
	logExpanded: 'No progress yet.',
	systemCount: 0,
}

const mergeLoopData = (next: Partial<LoopResponse>): LoopResponse => ({
	...emptyData,
	...next,
	columns: next.columns ?? emptyData.columns,
	activities: next.activities ?? emptyData.activities,
	currentTask: next.currentTask ?? emptyData.currentTask,
	status: next.status ?? emptyData.status,
	logPreview: next.logPreview ?? emptyData.logPreview,
	logExpanded: next.logExpanded ?? emptyData.logExpanded,
	systemCount: next.systemCount ?? emptyData.systemCount,
})

const formatPriority = (priority: Task['priority']) =>
	({
		HIGH: 'P1',
		MEDIUM: 'P2',
		LOW: 'P3',
	}[priority])

const formatStatusValue = (value: string | null) => value ?? '—'

const normalizeCreateError = (value: unknown) => {
	if (typeof value === 'string') {
		return value.split('\n').slice(0, 2).join(' ')
	}

	return 'Failed to create issue.'
}

const cx = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(' ')

export default function Home() {
	const [data, setData] = useState<LoopResponse>(emptyData)
	const [isSyncing, setIsSyncing] = useState(false)
	const isSyncingRef = useRef(false)
	const [showAddTask, setShowAddTask] = useState(false)
	const [taskTitle, setTaskTitle] = useState('')
	const [taskDescription, setTaskDescription] = useState('')
	const [taskPriority, setTaskPriority] = useState<Task['priority']>('MEDIUM')
	const [createError, setCreateError] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)
	const [isExpanded, setIsExpanded] = useState(true)
	const [activeTab, setActiveTab] = useState<'ralph' | 'system'>('ralph')
	const [isRunning, setIsRunning] = useState(true)
	const [showLog, setShowLog] = useState(false)
	const activity = useMemo(() => {
		return (
			data.activities[0] ?? {
				icon: 'search',
				label: 'Idle',
				detail: 'No live activity',
			}
		)
	}, [data.activities])

	const loadData = useCallback(async () => {
		if (isSyncingRef.current) {
			return
		}

		isSyncingRef.current = true
		setIsSyncing(true)

		try {
			const response = await fetch('/api/agent-loop', {
				cache: 'no-store',
			})

			if (!response.ok) {
				return
			}

			const payload = (await response.json()) as Partial<LoopResponse>
			setData(mergeLoopData(payload))
		} finally {
			isSyncingRef.current = false
			setIsSyncing(false)
		}
	}, [])

	const closeAddTask = useCallback(() => {
		setShowAddTask(false)
		setCreateError(null)
	}, [])

	const resetForm = useCallback(() => {
		setTaskTitle('')
		setTaskDescription('')
		setTaskPriority('MEDIUM')
		setCreateError(null)
	}, [])

	const createTask = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault()
			const title = taskTitle.trim()
			if (!title) {
				setCreateError('Title is required.')
				return
			}

			setIsCreating(true)
			setCreateError(null)

			try {
				const response = await fetch('/api/agent-loop', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						title,
						body: taskDescription.trim(),
						priority: taskPriority,
					}),
				})

				if (!response.ok) {
					const text = await response.text()
					let message = 'Failed to create issue.'
					if (text) {
						try {
							const parsed = JSON.parse(text) as { error?: unknown }
							message = normalizeCreateError(parsed.error ?? text)
						} catch {
							message = normalizeCreateError(text)
						}
					}
					setCreateError(message)
					return
				}

				resetForm()
				setShowAddTask(false)
				await loadData()
			} finally {
				setIsCreating(false)
			}
		},
		[loadData, resetForm, taskDescription, taskPriority, taskTitle],
	)

	useEffect(() => {
		loadData()
		const interval = setInterval(loadData, 15000)
		return () => clearInterval(interval)
	}, [loadData])

	const logPreviewText = data.logPreview?.trim()
		? data.logPreview
		: 'No progress yet.'
	const logExpandedText = data.logExpanded?.trim()
		? data.logExpanded
		: logPreviewText
	const isLive = data.status.state === 'Running'
	const showColumns = data.columns.length > 0

	return (
		<div
			className={cx(
				'min-h-screen',
				'bg-[#e9eef5]',
				'px-4',
				'py-8',
				'text-slate-900',
			)}
		>
			<div className="mx-auto w-full max-w-[980px]">
				<header className="flex flex-wrap items-center justify-between gap-4">
					<div className="space-y-1">
						<p className="text-2xl font-semibold leading-tight">PRD Task</p>
						<p className="text-2xl font-semibold leading-tight">Planner</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<button
							className={cx(
								'rounded-xl',
								'border',
								'border-slate-200',
								'bg-white',
								'px-4',
								'py-2.5',
								'text-sm',
								'font-medium',
								'text-slate-600',
								'shadow-sm',
								'transition',
								'hover:border-slate-300',
								isSyncing && 'opacity-60',
							)}
							style={{
								boxShadow: '0 10px 20px -18px rgba(15, 23, 42, 0.8)',
							}}
							onClick={loadData}
							disabled={isSyncing}
							aria-busy={isSyncing}
						>
							{isSyncing ? 'Syncing…' : 'Pull Latest'}
						</button>
						<button
							className={cx(
								'rounded-xl',
								'bg-[#2f67f6]',
								'px-4',
								'py-2.5',
								'text-sm',
								'font-semibold',
								'text-white',
								'shadow-sm',
								'transition',
								'hover:brightness-105',
							)}
							style={{
								boxShadow: '0 14px 30px -18px rgba(47, 103, 246, 0.9)',
							}}
							onClick={() => {
								setShowAddTask(true)
								setCreateError(null)
							}}
						>
							+ Add Task
						</button>
					</div>
				</header>

				<section
					className={cx(
						'mt-6',
						'rounded-2xl',
						'bg-[#223a57]',
						'p-4',
						'text-white',
						'shadow-xl',
					)}
				>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-2 text-sm font-medium">
							<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
							Ralph: {isRunning ? 'Running' : 'Paused'}
						</div>
						<div className="flex items-center gap-2">
							{isRunning && (
								<button
									className="rounded-lg bg-[#ee4b4b] px-3 py-1 text-xs font-semibold"
									onClick={() => setIsRunning(false)}
								>
									Stop Ralph
								</button>
							)}
							<button
								className="rounded-lg p-1 text-white/70"
								onClick={() => setIsExpanded((current) => !current)}
								aria-label="Toggle Ralph panel"
							>
								<ChevronIcon isExpanded={isExpanded} />
							</button>
						</div>
					</div>

					{isExpanded && (
						<div className="mt-4 space-y-4">
							<div className="flex items-center gap-2">
								<button
									className={tabClass(activeTab === 'ralph')}
									onClick={() => setActiveTab('ralph')}
								>
									Ralph
								</button>
								<button
									className={tabClass(activeTab === 'system')}
									onClick={() => setActiveTab('system')}
								>
									System
									<span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[11px]">
										{data.systemCount}
									</span>
								</button>
							</div>

							<div className="grid gap-3 md:grid-cols-2">
								<PanelCard title="Current Task">
									<div className="flex items-start justify-between gap-4">
										<p className="text-sm font-semibold text-white">
										{data.currentTask.title}
										</p>
										<span
											className={cx(
												'rounded-md',
												'bg-amber-400',
												'px-2',
												'py-0.5',
												'text-xs',
												'font-semibold',
												'text-slate-900',
											)}
										>
										{formatPriority(data.currentTask.priority)}
										</span>
									</div>
								</PanelCard>
								<PanelCard title="Status">
									<div className="space-y-1 text-sm text-white/80">
										<p>
										<span className="text-white/60">State:</span>{' '}
										{data.status.state}
										</p>
										<p>
										<span className="text-white/60">Running since:</span>{' '}
										{formatStatusValue(data.status.runningSince)}
										</p>
										<p>
										<span className="text-white/60">Last update:</span>{' '}
										{formatStatusValue(data.status.lastUpdate)}
										</p>
									</div>
								</PanelCard>
							</div>

							<PanelCard title="Live Activity">
								<div className="flex items-center justify-between gap-3 text-sm">
									<div className="flex items-center gap-3">
										<ActivityIcon icon={activity.icon} />
										<div>
											<p className="font-semibold text-white">{activity.label}</p>
											<p className="text-white/60">{activity.detail}</p>
										</div>
									</div>
										<div
											className={cx(
												'flex',
												'items-center',
												'gap-2',
												'text-xs',
												isLive ? 'text-emerald-200' : 'text-white/50',
											)}
										>
											<span
												className={cx(
													'h-2',
													'w-2',
													'rounded-full',
													isLive ? 'bg-emerald-300' : 'bg-white/30',
												)}
											/>
											{isLive ? 'live' : 'idle'}
										</div>
								</div>
							</PanelCard>

							<div className="space-y-2">
								<div className="flex items-center justify-between text-xs text-white/70">
									<p className="font-semibold uppercase tracking-wide">Progress Log</p>
									<div className="flex items-center gap-2">
										<button className="rounded-md bg-white/10 px-2 py-1">
											Clear
										</button>
										<button
											className="rounded-md bg-white/10 px-2 py-1"
											onClick={() => setShowLog(true)}
										>
											Expand
										</button>
									</div>
								</div>
								<div
									className={cx(
										'rounded-xl',
										'bg-[#1b2d44]',
										'p-3',
										'text-[11px]',
										'text-white/80',
									)}
								>
									<pre className="whitespace-pre-wrap font-mono">
										{logPreviewText}
									</pre>
								</div>
							</div>
						</div>
					)}
				</section>

				<section className="mt-6">
					<div className="flex gap-4 overflow-x-auto pb-4">
						{showColumns ? (
							data.columns.map((column) => (
							<div
								key={column.id}
								className={cx(
									'min-w-[240px]',
									'flex-1',
									'rounded-2xl',
									'bg-white/70',
									'p-3',
									'shadow-sm',
								)}
							>
								<div
									className={`rounded-xl border-t-4 ${column.accent} bg-white/80 p-3`}
								>
									<div className="flex items-center justify-between text-xs font-semibold">
										<p className="uppercase tracking-wide text-slate-500">
											{column.title}
										</p>
										<span
											className={cx(
												'rounded-full',
												'bg-slate-200',
												'px-2',
												'py-0.5',
												'text-slate-600',
											)}
										>
											{column.count}
										</span>
									</div>
								</div>
								<div className="mt-3 space-y-3">
									{column.tasks.map((task) => (
										<TaskCard key={task.id} task={task} />
									))}
								</div>
							</div>
							))
						) : (
							<div className="w-full rounded-2xl bg-white/60 p-6 text-center text-sm text-slate-500">
								No tasks yet.
							</div>
						)}
					</div>
				</section>
			</div>

			{showLog && (
				<div
					className={cx(
						'fixed',
						'inset-0',
						'z-20',
						'flex',
						'items-center',
						'justify-center',
						'bg-slate-900/40',
						'px-4',
						'py-6',
					)}
				>
					<div
						className={cx(
							'w-full',
							'max-w-[420px]',
							'rounded-2xl',
							'bg-[#223a57]',
							'text-white',
							'shadow-2xl',
						)}
					>
						<div
							className={cx(
								'flex',
								'items-center',
								'justify-between',
								'border-b',
								'border-white/10',
								'px-4',
								'py-3',
							)}
						>
							<p className="text-sm font-semibold">Progress Log</p>
							<button
								className="rounded-md p-1 text-white/60"
								onClick={() => setShowLog(false)}
								aria-label="Close progress log"
							>
								×
							</button>
						</div>
						<div
							className={cx(
								'max-h-[65vh]',
								'overflow-y-auto',
								'px-4',
								'py-3',
								'text-[12px]',
								'text-white/80',
							)}
						>
							<pre className="whitespace-pre-wrap font-mono">
								{logExpandedText}
							</pre>
						</div>
					</div>
				</div>
			)}

			{showAddTask && (
				<div
					className={cx(
						'fixed',
						'inset-0',
						'z-20',
						'flex',
						'items-center',
						'justify-center',
						'bg-slate-900/40',
						'px-4',
						'py-6',
					)}
				>
					<div
						className={cx(
							'w-full',
							'max-w-[480px]',
							'rounded-2xl',
							'bg-[#223a57]',
							'text-white',
							'shadow-2xl',
						)}
					>
						<div
							className={cx(
								'flex',
								'items-center',
								'justify-between',
								'border-b',
								'border-white/10',
								'px-4',
								'py-3',
							)}
						>
							<p className="text-sm font-semibold">Add Task</p>
							<button
								className="rounded-md p-1 text-white/60"
								onClick={closeAddTask}
								aria-label="Close add task"
							>
								×
							</button>
						</div>
						<form
							className="space-y-4 px-4 py-4"
							onSubmit={createTask}
						>
							<div className="space-y-2">
								<label className="text-xs font-semibold text-white/70">
									Title
								</label>
								<input
									className={cx(
										'w-full',
										'rounded-lg',
										'bg-white',
										'px-3',
										'py-2',
										'text-sm',
										'font-medium',
										'text-slate-700',
										'placeholder:text-slate-400',
										'outline-none',
										'ring-1',
										'ring-slate-200',
										'focus:ring-2',
										'focus:ring-blue-400',
									)}
									placeholder="Describe the task"
									value={taskTitle}
									onChange={(event) => setTaskTitle(event.target.value)}
									required
									disabled={isCreating}
								/>
							</div>
							<div className="space-y-2">
								<label className="text-xs font-semibold text-white/70">
									Description
								</label>
								<textarea
									className={cx(
										'min-h-[96px]',
										'w-full',
										'rounded-lg',
										'bg-white',
										'px-3',
										'py-2',
										'text-sm',
										'text-slate-700',
										'placeholder:text-slate-400',
										'outline-none',
										'ring-1',
										'ring-slate-200',
										'focus:ring-2',
										'focus:ring-blue-400',
									)}
									placeholder="Optional details"
									value={taskDescription}
									onChange={(event) =>
										setTaskDescription(event.target.value)
									}
									disabled={isCreating}
								/>
							</div>
							<div className="space-y-2">
								<label className="text-xs font-semibold text-white/70">
									Priority
								</label>
								<select
									className={cx(
										'w-full',
										'rounded-lg',
										'bg-white',
										'px-3',
										'py-2',
										'text-sm',
										'font-medium',
										'text-slate-700',
										'outline-none',
										'ring-1',
										'ring-slate-200',
										'focus:ring-2',
										'focus:ring-blue-400',
									)}
									value={taskPriority}
									onChange={(event) =>
										setTaskPriority(
											event.target.value as Task['priority'],
										)
									}
									disabled={isCreating}
								>
									<option value="HIGH">P1 - High</option>
									<option value="MEDIUM">P2 - Medium</option>
									<option value="LOW">P3 - Low</option>
								</select>
							</div>

							{createError && (
								<p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs">
									{createError}
								</p>
							)}
							<div className="flex items-center justify-end gap-2">
								<button
									type="button"
									className="rounded-lg bg-white/10 px-3 py-2 text-xs"
									onClick={closeAddTask}
									disabled={isCreating}
								>
									Cancel
								</button>
								<button
									type="submit"
									className={cx(
										'rounded-lg',
										'bg-[#2f67f6]',
										'px-3',
										'py-2',
										'text-xs',
										'font-semibold',
										'transition',
										isCreating && 'opacity-60',
									)}
									disabled={isCreating}
								>
									{isCreating ? 'Creating…' : 'Create Task'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}

function PanelCard({
	title,
	children,
}: {
	title: string
	children: ReactNode
}) {
	return (
		<div className="rounded-xl bg-white/10 p-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-white/60">
				{title}
			</p>
			<div className="mt-2">{children}</div>
		</div>
	)
}

function TaskCard({ task }: { task: Task }) {
	return (
		<article className="rounded-xl bg-white p-3 shadow-sm">
			<p className="text-[10px] font-semibold uppercase text-amber-500">
				{task.priority}
			</p>
			<p className="mt-1 text-xs text-slate-400">{task.group}</p>
			<h3 className="mt-1 text-sm font-semibold text-slate-800">
				{task.title}
			</h3>
			<p className="mt-1 text-xs text-slate-500">{task.description}</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{task.tags.map((tag) => (
					<TagPill key={`${task.id}-${tag.label}`} tag={tag} />
				))}
			</div>
		</article>
	)
}

function TagPill({ tag }: { tag: Tag }) {
	const toneClasses = {
		blue: 'bg-blue-50 text-blue-600',
		green: 'bg-emerald-100 text-emerald-700',
		purple: 'bg-purple-100 text-purple-700',
		slate: 'bg-slate-100 text-slate-600',
	}[tag.tone]

	return (
		<span
			className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
				toneClasses
			}`}
		>
			{tag.icon && <TagIcon icon={tag.icon} />}
			{tag.label}
		</span>
	)
}

function tabClass(isActive: boolean) {
	return [
		'rounded-lg px-3 py-1 text-xs font-semibold transition',
		isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70',
	].join(' ')
}

function ActivityIcon({ icon }: { icon: Activity['icon'] }) {
	return (
		<span
			className={cx(
				'flex',
				'h-8',
				'w-8',
				'items-center',
				'justify-center',
				'rounded-full',
				'bg-white/10',
			)}
		>
			{icon === 'book' && <BookIcon />}
			{icon === 'search' && <SearchIcon />}
			{icon === 'chat' && <ChatIcon />}
		</span>
	)
}

function BookIcon() {
	return (
		<svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="none">
			<rect x="4" y="4" width="6" height="12" rx="1" stroke="currentColor" />
			<rect x="10" y="4" width="6" height="12" rx="1" stroke="currentColor" />
		</svg>
	)
}

function SearchIcon() {
	return (
		<svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="none">
			<circle cx="8" cy="8" r="4" stroke="currentColor" />
			<path d="M12 12l4 4" stroke="currentColor" strokeLinecap="round" />
		</svg>
	)
}

function ChatIcon() {
	return (
		<svg aria-hidden className="h-4 w-4" viewBox="0 0 20 20" fill="none">
			<path
				d="M4 5h12v7H9l-5 4v-4H4z"
				stroke="currentColor"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function TagIcon({ icon }: { icon: NonNullable<Tag['icon']> }) {
	if (icon === 'branch') {
		return (
			<svg aria-hidden className="h-3 w-3" viewBox="0 0 20 20" fill="none">
				<circle cx="6" cy="5" r="2" stroke="currentColor" />
				<circle cx="14" cy="15" r="2" stroke="currentColor" />
				<path d="M6 7v5l6 3" stroke="currentColor" strokeLinecap="round" />
			</svg>
		)
	}

	if (icon === 'check') {
		return (
			<svg aria-hidden className="h-3 w-3" viewBox="0 0 20 20" fill="none">
				<path d="M4 10l4 4 8-8" stroke="currentColor" strokeLinecap="round" />
			</svg>
		)
	}

	if (icon === 'summary') {
		return (
			<svg aria-hidden className="h-3 w-3" viewBox="0 0 20 20" fill="none">
				<rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" />
				<path d="M7 8h6M7 12h6" stroke="currentColor" strokeLinecap="round" />
			</svg>
		)
	}

	return (
		<svg aria-hidden className="h-3 w-3" viewBox="0 0 20 20" fill="none">
			<rect x="5" y="4" width="10" height="12" rx="2" stroke="currentColor" />
			<path d="M7 10h6" stroke="currentColor" strokeLinecap="round" />
			<path d="M10 7v6" stroke="currentColor" strokeLinecap="round" />
		</svg>
	)
}

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
	return (
		<svg
			aria-hidden
			className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`}
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path d="M5.5 7.5a1 1 0 0 1 1.4 0L10 10.6l3.1-3.1a1 1 0 1 1 1.4 1.4l-3.8 3.8a1 1 0 0 1-1.4 0L5.5 8.9a1 1 0 0 1 0-1.4Z" />
		</svg>
	)
}
