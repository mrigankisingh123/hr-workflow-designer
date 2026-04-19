import React from 'react';
import { Handle, Position } from 'reactflow';

/**
 * Reusable Node Wrapper
 * Handles common styling and structure for all node types
 */
interface NodeWrapperProps {
  icon: string;
  label: string;
  color: 'green' | 'blue' | 'amber' | 'purple' | 'red';
  children?: React.ReactNode;
  showInput?: boolean;
  showOutput?: boolean;
}

const colorStyles: Record<string, { bg: string; border: string; icon: string }> = {
  green: {
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-400',
    icon: 'text-green-600',
  },
  blue: {
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-400',
    icon: 'text-blue-600',
  },
  amber: {
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-400',
    icon: 'text-amber-600',
  },
  purple: {
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-400',
    icon: 'text-purple-600',
  },
  red: {
    bg: 'from-red-50 to-rose-50',
    border: 'border-red-400',
    icon: 'text-red-600',
  },
};

function NodeWrapper({
  icon,
  label,
  color,
  children,
  showInput = true,
  showOutput = true,
}: NodeWrapperProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={`
        relative
        px-4 py-3
        bg-gradient-to-br ${styles.bg}
        border-2 ${styles.border}
        rounded-lg
        shadow-md
        hover:shadow-lg
        transition-all
        duration-200
        min-w-[180px]
        group
      `}
    >
      {/* Input Handle */}
      {showInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-gray-400 !border-2 !border-white !w-3 !h-3"
        />
      )}

      {/* Node Content */}
      <div className="space-y-2">
        {/* Icon + Label */}
        <div className="flex items-center gap-2">
          <span className={`text-xl ${styles.icon}`}>{icon}</span>
          <span className="font-semibold text-gray-900 text-sm">{label}</span>
        </div>

        {/* Optional children (description, fields, etc) */}
        {children && <div className="text-xs text-gray-600 mt-2">{children}</div>}
      </div>

      {/* Output Handle */}
      {showOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-gray-400 !border-2 !border-white !w-3 !h-3"
        />
      )}

      {/* Selection indicator */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-gray-300 pointer-events-none" />
    </div>
  );
}

/**
 * START NODE
 * Entry point for the workflow
 * - No input handle (nothing connects to it)
 * - Has output handle (connects to next node)
 */
export const StartNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="▶"
      label={data.label || 'Start'}
      color="green"
      showInput={false}
      showOutput={true}
    >
      {data.label && data.label !== 'Start' && <p>Workflow begins here</p>}
    </NodeWrapper>
  );
};

/**
 * TASK NODE
 * Represents a human task/action
 * - Has both input and output handles
 * - Shows task description if available
 */
export const TaskNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="✓"
      label={data.label || 'Task'}
      color="blue"
      showInput={true}
      showOutput={true}
    >
      {data.description && <p>{data.description}</p>}
      {data.assignee && <p className="font-medium">Assigned to: {data.assignee}</p>}
      {data.dueDate && <p className="text-gray-500">Due: {data.dueDate}</p>}
      {data.priority && (
        <p>
          Priority:{' '}
          <span
            className={`font-semibold ${
              data.priority === 'high'
                ? 'text-red-600'
                : data.priority === 'medium'
                ? 'text-amber-600'
                : 'text-green-600'
            }`}
          >
            {data.priority.charAt(0).toUpperCase() + data.priority.slice(1)}
          </span>
        </p>
      )}
    </NodeWrapper>
  );
};

/**
 * APPROVAL NODE
 * Requires someone to approve/reject
 * - Has both input and output handles
 * - Shows approver role
 */
export const ApprovalNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="⚡"
      label={data.label || 'Approval'}
      color="amber"
      showInput={true}
      showOutput={true}
    >
      {data.approverRole && (
        <p className="font-medium">
          Approver: <span className="text-gray-700">{data.approverRole}</span>
        </p>
      )}
      {data.autoApproveThreshold > 0 && (
        <p className="text-xs">Auto-approve below: ${data.autoApproveThreshold}</p>
      )}
      {data.requiresComment && <p className="text-xs italic">Comment required</p>}
    </NodeWrapper>
  );
};

/**
 * AUTOMATED STEP NODE
 * System-triggered action
 * - Has both input and output handles
 * - Shows action type (email, webhook, etc)
 */
export const AutomatedStepNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="⚙"
      label={data.label || 'Automated Step'}
      color="purple"
      showInput={true}
      showOutput={true}
    >
      {data.actionType && (
        <p className="font-medium">
          Action:{' '}
          <span className="text-gray-700">
            {data.actionType
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </span>
        </p>
      )}
      {data.actionParams && (
        <p className="text-xs text-gray-600 truncate">
          Params: {JSON.stringify(data.actionParams).substring(0, 30)}...
        </p>
      )}
    </NodeWrapper>
  );
};

/**
 * END NODE
 * Workflow completion
 * - Has input handle (something must connect to it)
 * - No output handle (end of workflow)
 */
export const EndNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="■"
      label={data.label || 'Complete'}
      color="red"
      showInput={true}
      showOutput={false}
    >
      {data.label && data.label !== 'Complete' && <p>Workflow ends here</p>}
      {data.showSummary && <p className="text-xs italic">Summary will be shown</p>}
    </NodeWrapper>
  );
};

/**
 * DECISION NODE (Bonus - not in basic registry)
 * Branches workflow based on condition
 * - Has input handle
 * - Has multiple output handles (true/false branches)
 */
export const DecisionNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="⚔"
      label={data.label || 'Decision'}
      color="purple"
      showInput={true}
      showOutput={false}
    >
      {data.condition && <p className="text-xs font-mono">{data.condition}</p>}

      {/* True branch */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!left-1/4 !translate-x-0 !bg-green-400 !border-2 !border-white !w-3 !h-3"
      />

      {/* False branch */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!right-1/4 !translate-x-0 !bg-red-400 !border-2 !border-white !w-3 !h-3"
      />
    </NodeWrapper>
  );
};

/**
 * WEBHOOK NODE (Bonus - not in basic registry)
 * Calls an external API
 */
export const WebhookNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="🔗"
      label={data.label || 'Webhook'}
      color="purple"
      showInput={true}
      showOutput={true}
    >
      {data.url && <p className="text-xs truncate">{data.url}</p>}
      {data.method && <p className="text-xs font-mono">{data.method}</p>}
    </NodeWrapper>
  );
};

/**
 * DELAY NODE (Bonus - not in basic registry)
 * Wait for a specified time period
 */
export const DelayNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="⏱"
      label={data.label || 'Delay'}
      color="blue"
      showInput={true}
      showOutput={true}
    >
      {data.duration && data.unit && (
        <p className="font-medium">
          Wait: {data.duration} {data.unit}
        </p>
      )}
    </NodeWrapper>
  );
};

/**
 * NOTIFICATION NODE (Bonus - not in basic registry)
 * Send a notification to users
 */
export const NotificationNode = ({ data }: { data: any }) => {
  return (
    <NodeWrapper
      icon="🔔"
      label={data.label || 'Notify'}
      color="blue"
      showInput={true}
      showOutput={true}
    >
      {data.recipients && <p className="text-xs">To: {data.recipients}</p>}
      {data.message && <p className="text-xs truncate italic">{data.message}</p>}
    </NodeWrapper>
  );
};