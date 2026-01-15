'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'

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

const liveActivities: Activity[] = [
	{
		icon: 'book',
		label: 'Reading',
		detail: 'Wrapper.vue',
	},
	{
		icon: 'search',
		label: 'Searching',
		detail: 'toCheckout / createCheckoutSession',
	},
	{
		icon: 'chat',
		label: 'Responding',
		detail: 'Perfect. I have all the context I need',
	},
]

const columns: Column[] = [
	{
		id: 'ready',
		title: 'Ready',
		count: 5,
		accent: 'border-amber-300',
		tasks: [
			{
				id: 'pr-5-9',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-9 Redirect review page to payment',
				description:
					'Implement step 10 by updating the review page routing logic',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
				],
			},
			{
				id: 'pr-5-10',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-10 Update ad CTAs for headshot flow',
				description:
					'Implement step 11 by updating ad CTA components and links',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
				],
			},
			{
				id: 'pr-5-11',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-11 Add payment tracking to vuex store',
				description:
					'Implement step 12 by adding payment tracking state updates',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
				],
			},
		],
	},
	{
		id: 'active',
		title: 'Active',
		count: 2,
		accent: 'border-blue-400',
		tasks: [
			{
				id: 'pr-5-7',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-7 Create anonymous checkout endpoint',
				description:
					'Implement step 7 by wiring anonymous users into checkout creation',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
				],
			},
			{
				id: 'pr-5-8',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-8 Connect payment route to headshot flow',
				description:
					'Implement step 8 by routing payment to onboarding with anon data',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
				],
			},
		],
	},
	{
		id: 'review',
		title: 'Review',
		count: 7,
		accent: 'border-purple-400',
		tasks: [
			{
				id: 'pr-5-1',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-1 Set ad visitor flag in localStorage',
				description:
					'Implement step 1 by updating ad entry to set localStorage flag',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
					{
						label: '286fdec',
						tone: 'slate',
						icon: 'commit',
					},
					{
						label: 'Summary',
						tone: 'purple',
						icon: 'summary',
					},
				],
			},
			{
				id: 'pr-5-2',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-2 Create ad visitor helper utilities',
				description:
					'Implement step 2 by creating ad visitor helper utilities',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
					{
						label: 'ecf51df',
						tone: 'slate',
						icon: 'commit',
					},
					{
						label: 'Summary',
						tone: 'purple',
						icon: 'summary',
					},
				],
			},
			{
				id: 'pr-5-3',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-3 Create anonymous Firebase auth utilities',
				description:
					'Implement step 3 by creating anonymous auth utilities',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Plan Ready',
						tone: 'green',
						icon: 'check',
					},
					{
						label: 'Summary',
						tone: 'purple',
						icon: 'summary',
					},
				],
			},
		],
	},
	{
		id: 'done',
		title: 'Done',
		count: 4,
		accent: 'border-emerald-400',
		tasks: [
			{
				id: 'pr-5-6',
				priority: 'MEDIUM',
				group: 'PRD-5',
				title: 'PRD-5-6 Allow anonymous virtual headshot models',
				description:
					'Implement step 6 by updating the model schema and onboarding',
				tags: [
					{
						label: 'feat/late-payment',
						tone: 'blue',
						icon: 'branch',
					},
					{
						label: 'Summary',
						tone: 'purple',
						icon: 'summary',
					},
				],
			},
		],
	},
]

const logPreview = `### PRD-5-1: Set ad visitor flag in localStorage
**Date:** 2026-01-15

**Implemented:**
- Added localStorage flag tracking to ads entry
- Guarded for existing sessions before writing

**Files Changed:**
- app/pages/LP/ads.vue
`

const logExpanded = `### PRD-5-1: Set ad visitor flag in localStorage
**Date:** 2026-01-15

**Implemented:**
- Added localStorage flag tracking to ads entry
- Guarded for existing sessions before writing
- Updated CTA flow to reuse the existing modal

**Files Changed:**
- app/pages/LP/ads.vue — set localStorage visitor flag
- app/utils/adVisitorHelper.js — helper to check visitor status

**Learnings:**
- Firebase auth state changes are asynchronous
- This page is the entry point for virtual headshot flow
- createAnonymousUser helper is shared across onboarding
- EmailAuthProvider comes from firebase.auth.EmailAuthProvider
- linkWithCredential preserves UID for conversion

### PRD-5-6: Update backend to allow anonymous virtual headshot models
**Date:** 2026-01-15

**Implemented:**
- Added isTemporaryAnonymous and anonymousUserId fields to Model schema
- Modified onboarding/start endpoint to detect anonymous Firebase users
- Anonymous users bypass package validation and get default medium package
`

const cx = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(' ')

export default function Home() {
	const [isExpanded, setIsExpanded] = useState(true)
	const [activeTab, setActiveTab] = useState<'ralph' | 'system'>('ralph')
	const [isRunning, setIsRunning] = useState(true)
	const [showLog, setShowLog] = useState(false)
	const [activityIndex, setActivityIndex] = useState(0)

	const activity = useMemo(
		() => liveActivities[activityIndex],
		[activityIndex],
	)

	useEffect(() => {
		const interval = setInterval(() => {
			setActivityIndex((current) => (current + 1) % liveActivities.length)
		}, 3500)

		return () => clearInterval(interval)
	}, [])

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
							)}
							style={{
								boxShadow: '0 10px 20px -18px rgba(15, 23, 42, 0.8)',
							}}
						>
							Pull Latest
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
							)}
							style={{
								boxShadow: '0 14px 30px -18px rgba(47, 103, 246, 0.9)',
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
										5
									</span>
								</button>
							</div>

							<div className="grid gap-3 md:grid-cols-2">
								<PanelCard title="Current Task">
									<div className="flex items-start justify-between gap-4">
										<p className="text-sm font-semibold text-white">
											Create payment page with account conversion
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
											P2
										</span>
									</div>
								</PanelCard>
								<PanelCard title="Status">
									<div className="space-y-1 text-sm text-white/80">
										<p>
											<span className="text-white/60">State:</span> Running
										</p>
										<p>
											<span className="text-white/60">Running since:</span> 13:59:40
										</p>
										<p>
											<span className="text-white/60">Last update:</span> 14:14:45
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
									<div className="flex items-center gap-2 text-xs text-emerald-200">
										<span className="h-2 w-2 rounded-full bg-emerald-300" />
										live
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
										{logPreview}
									</pre>
								</div>
							</div>
						</div>
					)}
				</section>

				<section className="mt-6">
					<div className="flex gap-4 overflow-x-auto pb-4">
						{columns.map((column) => (
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
						))}
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
							<pre className="whitespace-pre-wrap font-mono">{logExpanded}</pre>
						</div>
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
