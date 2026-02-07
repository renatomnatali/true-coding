# True Coding - Project Page UX Review and Recommendations

## Executive Summary

The current project page (`/project/[id]`) presents a critical UX failure: after creating a project, users land on an empty page with only a project name and status indicator. This creates a "dead end" experience that violates fundamental UX principles around user guidance, progressive disclosure, and clear affordances.

This document provides a comprehensive analysis and actionable recommendations based on competitive research (v0.dev, Cursor, Bolt.new, Lovable.dev, GitHub Copilot Workspace) and established UX principles.

---

## Part 1: Current State Analysis

### What Exists Now

**File: `/src/app/project/[id]/project-details.tsx`**

The current implementation renders:
1. Project name (h1)
2. Status badge (colored icon + label)
3. Description (if exists)
4. Quick links section (only visible if GitHub repo or production URL exists)
5. Generation section (only visible if technical plan exists AND GitHub connected AND no repo yet)
6. Business Plan JSON dump (only visible if exists)
7. Technical Plan JSON dump (only visible if exists)
8. Warning about GitHub connection (only if technical plan exists but no GitHub)

### Critical UX Problems

| Issue | Severity | Nielsen Heuristic Violated |
|-------|----------|---------------------------|
| No navigation to return to dashboard | Critical | User control and freedom |
| No user menu/account access | Critical | Consistency and standards |
| Empty state provides no guidance | Critical | Help users recognize, diagnose, recover |
| No visible path forward | Critical | Visibility of system status |
| Chat interface not rendered | Critical | Match between system and real world |
| No progress indicator showing journey | High | Visibility of system status |
| JSON dumps for plans are unusable | High | Aesthetic and minimalist design |
| Status badge lacks context | Medium | Help and documentation |
| No mobile considerations | High | Flexibility and efficiency |

### Mental Model Mismatch

Users expect:
- "I just created a project, now I describe what I want to build"
- Clear next step visible immediately
- Conversational interface (based on onboarding flow)

What they get:
- Empty page with cryptic "Em ideacao" status
- No input mechanism
- No explanation of what to do

---

## Part 2: Competitive Analysis

### v0.dev / v0.app
- **Layout**: Central prompt area with "What do you want to create?"
- **Workflow**: Prompt -> Build -> Publish (3 clear stages)
- **Key pattern**: Quick-start templates below main input
- **Navigation**: Minimal header, focus on creation

### Lovable.dev
- **Layout**: Prominent chat input with placeholder guidance
- **Workflow**: Describe -> AI generates -> Iterate
- **Key pattern**: Typewriter effect suggesting prompts
- **Navigation**: Workspace sidebar, project visibility controls

### Cursor IDE
- **Layout**: IDE-centric with chat panel
- **Workflow**: Multiple autonomy levels (Tab, Cmd+K, Agent)
- **Key pattern**: "Autonomy slider" - user controls AI independence
- **Navigation**: VS Code familiar patterns

### GitHub Copilot Workspace
- **Layout**: Task-driven structured stages
- **Workflow**: Issue -> Specs -> Plan -> Code (editable at each step)
- **Key pattern**: User stays in control at every step
- **Navigation**: Issue/task as entry point

### Bolt.new
- **Layout**: Conversation-centric, minimal chrome
- **Workflow**: Chat-driven development
- **Key pattern**: Dark/light mode, session persistence

### Synthesis: Industry Patterns

1. **Chat-first interaction**: All competitors center on conversational UI
2. **Visible progress**: Clear indication of where user is in the workflow
3. **Guided prompts**: Suggestions/templates to reduce blank-page anxiety
4. **Minimal navigation**: Focus on creation, not navigation
5. **Real-time feedback**: Streaming responses, progress indicators
6. **Editable artifacts**: Users can review/edit AI outputs before proceeding

---

## Part 3: Proposed Architecture

### Layout Structure (Desktop-First, Mobile-Responsive)

```
+------------------------------------------------------------------+
|  HEADER (64px)                                                    |
|  [<- Back] [True Coding Logo]          [Status] [User Menu]       |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+  +--------------------------------------+   |
|  | SIDEBAR (280px)  |  | MAIN CONTENT AREA                   |   |
|  |                  |  |                                      |   |
|  | Progress Steps   |  |  +--------------------------------+  |   |
|  | ===============  |  |  | PHASE-SPECIFIC CONTENT         |  |   |
|  | [x] Ideation     |  |  |                                |  |   |
|  | [ ] Planning     |  |  | (Chat, Plan Review, GitHub,    |  |   |
|  | [ ] GitHub       |  |  |  Generation, Deploy)           |  |   |
|  | [ ] Generate     |  |  |                                |  |   |
|  | [ ] Deploy       |  |  +--------------------------------+  |   |
|  |                  |  |                                      |   |
|  | ===============  |  |  +--------------------------------+  |   |
|  | Project Info     |  |  | INPUT AREA (fixed bottom)      |  |   |
|  | Quick Actions    |  |  | [                         ][>] |  |   |
|  |                  |  |  +--------------------------------+  |   |
|  +------------------+  +--------------------------------------+   |
+------------------------------------------------------------------+
```

### Mobile Layout (< 640px)

```
+---------------------------+
| HEADER (56px)             |
| [<-] [Logo] [Status] [=]  |
+---------------------------+
| PROGRESS BAR (compact)    |
| [=====>                 ] |
| Step 1 of 5: Ideation     |
+---------------------------+
|                           |
| MAIN CONTENT AREA         |
| (Full width, scrollable)  |
|                           |
| Phase-specific content    |
| adapts to mobile          |
|                           |
+---------------------------+
| INPUT AREA (fixed)        |
| [                    ][>] |
+---------------------------+
```

### Tablet Layout (640px - 1024px)

- Collapsible sidebar (icon-only by default)
- Expand on hover/tap
- Main content takes remaining space

---

## Part 4: Component Hierarchy

```
ProjectPage (server component)
|
+-- ProjectShell (client component - layout wrapper)
    |
    +-- ProjectHeader
    |   +-- BackButton (-> /dashboard)
    |   +-- Logo
    |   +-- ProjectStatusBadge
    |   +-- UserMenu (Clerk UserButton)
    |
    +-- ProjectSidebar
    |   +-- ProgressStepper
    |   |   +-- StepItem (Ideation)
    |   |   +-- StepItem (Planning)
    |   |   +-- StepItem (GitHub)
    |   |   +-- StepItem (Generation)
    |   |   +-- StepItem (Deploy)
    |   |
    |   +-- ProjectQuickInfo
    |   |   +-- ProjectName
    |   |   +-- CreatedDate
    |   |
    |   +-- QuickActions
    |       +-- ViewRepoLink (conditional)
    |       +-- ViewLiveLink (conditional)
    |       +-- DeleteProject
    |
    +-- ProjectMainContent
        |
        +-- PhaseRenderer (switches based on status)
            |
            +-- IdeationPhase
            |   +-- WelcomeMessage
            |   +-- ChatWindow
            |   +-- PromptSuggestions
            |
            +-- PlanningPhase
            |   +-- BusinessPlanCard
            |   +-- TechnicalPlanCard
            |   +-- PlanApprovalActions
            |
            +-- ConnectingPhase
            |   +-- GitHubConnectionCard
            |   +-- WhyGitHubExplainer
            |
            +-- GeneratingPhase
            |   +-- GenerationProgress
            |   +-- FileTree (live update)
            |
            +-- DeployingPhase
            |   +-- VercelConnectionCard
            |   +-- DeploymentProgress
            |
            +-- LivePhase
                +-- SuccessCelebration
                +-- QuickLinks
                +-- NextSteps
```

---

## Part 5: Phase-Specific Recommendations

### Phase 1: IDEATION

**User Goal**: Describe the app idea and refine requirements through conversation

**Layout**:
```
+------------------------------------------+
| Welcome, [Name]!                          |
| Let's build something amazing.            |
|                                           |
| Tell me about the app you want to create. |
| I'll ask questions to understand your     |
| requirements better.                      |
+------------------------------------------+
|                                           |
| [Chat Messages Area - scrollable]         |
|                                           |
| AI: Hi! What kind of app...               |
| User: I want to build...                  |
| AI: Great! Who is the target...           |
|                                           |
+------------------------------------------+
| Suggestions:                              |
| [A task manager] [E-commerce] [Portfolio] |
+------------------------------------------+
| [Type your message...              ] [>]  |
+------------------------------------------+
```

**Key Elements**:
- Welcome message with user's name (from Clerk)
- Clear explanation of current phase
- Chat interface as primary interaction
- Prompt suggestions for blank-page anxiety
- Sticky input at bottom

**Accessibility**:
- `aria-live="polite"` on chat messages
- Focus management on new messages
- Keyboard navigation (Enter to send, Shift+Enter for newline)

### Phase 2: PLANNING

**User Goal**: Review and approve BusinessPlan and TechnicalPlan

**Layout**:
```
+------------------------------------------+
| Your App Plan                             |
| Review the generated plans and approve    |
| or request changes.                       |
+------------------------------------------+
|                                           |
| Business Plan                      [Edit] |
| +--------------------------------------+  |
| | Name: TaskFlow                       |  |
| | Tagline: Manage tasks, not chaos     |  |
| | ...                                  |  |
| +--------------------------------------+  |
|                                           |
| Technical Plan                     [Edit] |
| +--------------------------------------+  |
| | Stack: Next.js, Prisma, PostgreSQL   |  |
| | Features: 5 core, 3 nice-to-have     |  |
| | ...                                  |  |
| +--------------------------------------+  |
|                                           |
+------------------------------------------+
| [Request Changes]        [Approve Plans] |
+------------------------------------------+
```

**Key Elements**:
- Structured plan display (not JSON dumps)
- Collapsible sections for detailed info
- Edit capability returns to chat
- Clear approval CTA

**Accessibility**:
- Semantic headings (h2, h3)
- Expandable regions with `aria-expanded`
- Button states clearly communicated

### Phase 3: CONNECTING (GitHub)

**User Goal**: Connect GitHub account to enable code generation

**Layout**:
```
+------------------------------------------+
| Connect GitHub                            |
| We need access to create your repository  |
+------------------------------------------+
|                                           |
| +--------------------------------------+  |
| | [GitHub Icon]                        |  |
| |                                      |  |
| | Connect your GitHub account to:      |  |
| | - Create a private repository        |  |
| | - Push generated code automatically  |  |
| | - Enable CI/CD workflows             |  |
| |                                      |  |
| | [Connect GitHub]                     |  |
| +--------------------------------------+  |
|                                           |
| Why do we need this?                      |
| [Learn more about permissions]            |
|                                           |
+------------------------------------------+
```

**Key Elements**:
- Clear value proposition
- Permission transparency
- OAuth redirect handling
- Success/error states

### Phase 4: GENERATING

**User Goal**: Watch code being generated and committed

**Layout**:
```
+------------------------------------------+
| Generating Your App                       |
| This usually takes 2-3 minutes            |
+------------------------------------------+
|                                           |
| Stage: Generating files... (2/4)          |
| [=========>                            ]  |
|                                           |
| +--------------------------------------+  |
| | Files Created:                       |  |
| | [x] src/app/page.tsx                 |  |
| | [x] src/components/Header.tsx        |  |
| | [>] src/lib/db.ts (generating...)    |  |
| | [ ] prisma/schema.prisma             |  |
| +--------------------------------------+  |
|                                           |
| Tip: You can leave this page.             |
| We'll notify you when it's ready.         |
|                                           |
+------------------------------------------+
```

**Key Elements**:
- Estimated time
- Real-time progress (SSE streaming)
- File-by-file feedback
- Reassurance about leaving page
- Error recovery options

**Accessibility**:
- `aria-live="assertive"` for stage changes
- Progress bar with `role="progressbar"`
- Status announcements

### Phase 5: DEPLOYING

**User Goal**: Connect Vercel and deploy the generated app

**Layout**:
```
+------------------------------------------+
| Deploy to Production                      |
| Your code is ready! Let's make it live.   |
+------------------------------------------+
|                                           |
| Repository: github.com/user/taskflow      |
| [View on GitHub]                          |
|                                           |
| +--------------------------------------+  |
| | [Vercel Icon]                        |  |
| |                                      |  |
| | Deploy with Vercel                   |  |
| | - Automatic HTTPS                    |  |
| | - Global CDN                         |  |
| | - Preview deployments                |  |
| |                                      |  |
| | [Connect Vercel]                     |  |
| +--------------------------------------+  |
|                                           |
| Or deploy manually:                       |
| [Clone & Deploy Yourself]                 |
|                                           |
+------------------------------------------+
```

### Phase 6: LIVE

**User Goal**: Access the deployed app and understand next steps

**Layout**:
```
+------------------------------------------+
| Your App is Live!                         |
| Congratulations on launching TaskFlow     |
+------------------------------------------+
|                                           |
| [Visit Your App ->]                       |
| https://taskflow.vercel.app               |
|                                           |
| +--------------------------------------+  |
| | Quick Links                          |  |
| | [GitHub] [Vercel Dashboard]          |  |
| +--------------------------------------+  |
|                                           |
| What's Next?                              |
| - Customize the design                    |
| - Add more features                       |
| - Share with your team                    |
|                                           |
| [Start a New Project]                     |
|                                           |
+------------------------------------------+
```

---

## Part 6: Responsive Design Specifications

### Breakpoints

| Name | Range | Layout Changes |
|------|-------|----------------|
| Mobile | < 640px | Single column, bottom sheet sidebar, compact header |
| Tablet | 640px - 1024px | Collapsible sidebar (48px collapsed), fluid main |
| Desktop | > 1024px | Fixed sidebar (280px), fluid main |

### Touch Targets

All interactive elements must meet minimum 44x44px touch target:

```css
/* Button minimum sizes */
.btn-mobile {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Input fields */
.input-mobile {
  min-height: 48px;
  font-size: 16px; /* Prevents iOS zoom */
}
```

### Mobile-Specific Patterns

1. **Bottom Sheet Navigation**: Progress stepper appears as bottom sheet on tap
2. **Swipe Gestures**: Swipe right to reveal sidebar
3. **Sticky Input**: Chat input fixed to bottom with safe-area-inset
4. **Reduced Motion**: Respect `prefers-reduced-motion`

```css
/* Safe area for notched devices */
.input-container {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}
```

---

## Part 7: Accessibility Requirements (WCAG 2.1 AA)

### Color Contrast

Current status colors need verification:

| Status | Current Color | Contrast Check |
|--------|---------------|----------------|
| IDEATION | text-yellow-500 | Verify 4.5:1 on background |
| PLANNING | text-blue-500 | Verify 4.5:1 on background |
| CONNECTING | text-purple-500 | Verify 4.5:1 on background |
| GENERATING | text-orange-500 | Verify 4.5:1 on background |
| LIVE | text-green-500 | Verify 4.5:1 on background |
| FAILED | text-red-500 | Verify 4.5:1 on background |

**Recommendation**: Use darker variants (600-700) for text, lighter variants for backgrounds.

### Focus Management

```typescript
// After phase transition, focus the main content area
useEffect(() => {
  if (phaseChanged) {
    mainContentRef.current?.focus();
  }
}, [status]);
```

### Screen Reader Support

```tsx
// Announce phase changes
<div role="status" aria-live="polite" className="sr-only">
  {`Project status changed to ${statusLabel}`}
</div>

// Progress stepper with proper semantics
<nav aria-label="Project progress">
  <ol>
    <li aria-current={isActive ? 'step' : undefined}>
      {stepLabel}
    </li>
  </ol>
</nav>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move through interactive elements |
| Enter | Activate buttons, submit forms |
| Escape | Close modals, cancel actions |
| Arrow Up/Down | Navigate chat history |

---

## Part 8: State Management Recommendations

### Zustand Store Structure

```typescript
interface ProjectStore {
  // Project data
  project: Project | null;

  // UI state
  sidebarOpen: boolean;
  activePhase: ProjectStatus;

  // Chat state (per project)
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;

  // Actions
  setProject: (project: Project) => void;
  toggleSidebar: () => void;
  sendMessage: (content: string) => Promise<void>;
  transitionPhase: (newPhase: ProjectStatus) => void;
}
```

### Optimistic Updates

```typescript
// When user sends message, immediately show in UI
const sendMessage = async (content: string) => {
  const tempId = `temp-${Date.now()}`;

  // Optimistic add
  set((state) => ({
    messages: [...state.messages, {
      id: tempId,
      role: 'user',
      content,
      createdAt: new Date(),
    }],
  }));

  try {
    await api.sendMessage(content);
    // Message persisted
  } catch (error) {
    // Rollback on error
    set((state) => ({
      messages: state.messages.filter(m => m.id !== tempId),
    }));
  }
};
```

---

## Part 9: Implementation Priority

### Phase 1: Critical (Week 1)

1. Add navigation header with back button and user menu
2. Implement progress stepper sidebar
3. Integrate existing ChatWindow component for IDEATION phase
4. Add phase-aware content rendering

### Phase 2: High Priority (Week 2)

1. Redesign plan display (replace JSON dumps)
2. Implement phase transitions with proper feedback
3. Add mobile responsive layout
4. Implement keyboard navigation

### Phase 3: Enhancement (Week 3)

1. Add prompt suggestions for blank-page anxiety
2. Implement real-time progress for generation
3. Add celebration/success states
4. Polish animations and transitions

### Phase 4: Polish (Week 4)

1. Accessibility audit and fixes
2. Performance optimization
3. Error boundary implementation
4. Analytics integration

---

## Part 10: Component Specifications

### ProjectHeader

```typescript
interface ProjectHeaderProps {
  projectName: string;
  status: ProjectStatus;
  onBack: () => void;
}

// Specifications
// Height: 64px (desktop), 56px (mobile)
// Logo: 32px height
// Back button: Ghost variant, 40x40px touch target
// Status badge: Pill shape, 8px padding horizontal
// User menu: Clerk UserButton, 40x40px
```

### ProgressStepper

```typescript
interface ProgressStepperProps {
  currentStatus: ProjectStatus;
  completedStatuses: ProjectStatus[];
  onStepClick?: (status: ProjectStatus) => void;
}

// Specifications
// Step height: 48px
// Icon size: 24px
// Connector line: 2px, extends between steps
// States: pending (gray), active (primary), completed (green)
// Animation: 200ms ease-out on state change
```

### PhaseContent

```typescript
interface PhaseContentProps {
  project: Project;
  onPhaseComplete: (nextStatus: ProjectStatus) => void;
}

// Specifications
// Max width: 800px (centered in container)
// Padding: 24px (desktop), 16px (mobile)
// Card border-radius: 12px
// Card shadow: sm (subtle elevation)
```

---

## Part 11: Error States

### Network Error

```
+------------------------------------------+
| [Warning Icon]                            |
|                                           |
| Connection Lost                           |
| We're having trouble reaching our servers |
|                                           |
| [Retry] [Work Offline]                    |
+------------------------------------------+
```

### Generation Failure

```
+------------------------------------------+
| [Error Icon]                              |
|                                           |
| Code Generation Failed                    |
| {error.message}                           |
|                                           |
| What you can do:                          |
| - Check your GitHub permissions           |
| - Try with a simpler project              |
| - Contact support                         |
|                                           |
| [Try Again] [Get Help]                    |
+------------------------------------------+
```

### Session Expired

```
+------------------------------------------+
| [Lock Icon]                               |
|                                           |
| Session Expired                           |
| Please sign in again to continue          |
|                                           |
| Your progress has been saved.             |
|                                           |
| [Sign In]                                 |
+------------------------------------------+
```

---

## Part 12: Animation Specifications

### Phase Transitions

```css
/* Content fade in/out */
.phase-enter {
  opacity: 0;
  transform: translateY(8px);
}
.phase-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

/* Progress step completion */
.step-complete {
  animation: checkmark 300ms ease-out;
}

@keyframes checkmark {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Appendix A: File Changes Required

| File | Action | Description |
|------|--------|-------------|
| `/src/app/project/[id]/page.tsx` | Modify | Add layout shell |
| `/src/app/project/[id]/project-details.tsx` | Rewrite | Implement new architecture |
| `/src/components/project/ProjectHeader.tsx` | Create | Navigation header |
| `/src/components/project/ProgressStepper.tsx` | Create | Sidebar progress |
| `/src/components/project/ProjectSidebar.tsx` | Create | Sidebar container |
| `/src/components/project/phases/IdeationPhase.tsx` | Create | Chat-focused phase |
| `/src/components/project/phases/PlanningPhase.tsx` | Create | Plan review phase |
| `/src/components/project/phases/ConnectingPhase.tsx` | Create | GitHub connection |
| `/src/components/project/phases/GeneratingPhase.tsx` | Modify | Enhance existing |
| `/src/components/project/phases/DeployingPhase.tsx` | Create | Vercel deployment |
| `/src/components/project/phases/LivePhase.tsx` | Create | Success state |
| `/src/stores/project.ts` | Create | Project state management |

---

## Appendix B: Design Tokens

```css
/* Spacing scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;

/* Sidebar */
--sidebar-width: 280px;
--sidebar-collapsed: 48px;

/* Header */
--header-height: 64px;
--header-height-mobile: 56px;

/* Content */
--content-max-width: 800px;
--content-padding: var(--space-6);
--content-padding-mobile: var(--space-4);

/* Border radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

---

## Conclusion

The current project page fails to provide the essential affordances users need to understand what to do next. By implementing:

1. **Clear navigation** - Users can return to dashboard or access account settings
2. **Visual progress** - Users understand where they are in the journey
3. **Phase-appropriate content** - Each stage has focused, relevant UI
4. **Chat-first interaction** - Matches user mental model from competitor research
5. **Mobile-responsive design** - Works on all devices
6. **Accessible implementation** - Meets WCAG 2.1 AA standards

The redesigned experience transforms a confusing dead-end into a guided, supportive journey from idea to deployed application.
