import React from 'react';
import { StartNode, TaskNode, ApprovalNode, EndNode } from './nodeComponents';

/**
 * Form field configuration - defines what inputs appear in the node form
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'number' | 'boolean';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

/**
 * Node type configuration - everything needed to render and edit a node
 */
export interface NodeTypeConfig {
  component: React.ComponentType<{ data: unknown }>;
  label: string;
  description: string;
  icon: string;
  color: 'green' | 'blue' | 'amber' | 'purple' | 'red';
  formSchema: FormFieldConfig[];
  defaultData: Record<string, unknown>;
  validate?: (data: Record<string, unknown>) => { valid: boolean; errors?: string[] };
}

export type NodeTypeKey = 'start' | 'task' | 'approval' | 'end';

/**
 * Node Registry - Single source of truth for all node types
 *
 * To add a new node type:
 * 1. Create a new component in nodeComponents.ts
 * 2. Add one entry here with its config
 * 3. Update the NodeTypeKey type above
 *
 * To modify an existing node type:
 * 1. Edit the formSchema array
 * 2. Update defaultData
 * 3. Update component if needed
 *
 * Everything else (UI rendering, form generation) updates automatically
 */
export const nodeRegistry: Record<NodeTypeKey, NodeTypeConfig> = Object.freeze({
  start: {
    component: StartNode,
    label: 'Start',
    description: 'Workflow entry point',
    icon: '▶',
    color: 'green',
    formSchema: [
      {
        name: 'label',
        label: 'Label',
        type: 'text',
        required: true,
        placeholder: 'e.g., Begin onboarding',
        validation: { minLength: 2, maxLength: 50 },
      },
    ],
    defaultData: {
      label: 'Start',
    },
    validate: (data) => {
      const errors: string[] = [];

      if (!data.label || (data.label as string).trim() === '') {
        errors.push('Label is required');
      } else if ((data.label as string).length < 2) {
        errors.push('Label must be at least 2 characters');
      } else if ((data.label as string).length > 50) {
        errors.push('Label must be less than 50 characters');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
  },

  task: {
    component: TaskNode,
    label: 'Task',
    description: 'Human task (e.g., collect documents)',
    icon: '✓',
    color: 'blue',
    formSchema: [
      {
        name: 'label',
        label: 'Task Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Collect Documents',
        validation: { minLength: 2, maxLength: 50 },
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'What should the user do?',
        validation: { maxLength: 500 },
      },
      {
        name: 'assignee',
        label: 'Assignee',
        type: 'text',
        placeholder: 'e.g., HR Manager',
      },
      {
        name: 'dueDate',
        label: 'Due Date',
        type: 'date',
      },
      {
        name: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    ],
    defaultData: {
      label: 'Task',
      description: '',
      assignee: '',
      dueDate: '',
      priority: 'medium',
    },
    validate: (data) => {
      const errors: string[] = [];

      if (!data.label || (data.label as string).trim() === '') {
        errors.push('Task name is required');
      }

      if (data.description && (data.description as string).length > 500) {
        errors.push('Description must be less than 500 characters');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
  },

  approval: {
    component: ApprovalNode,
    label: 'Approval',
    description: 'Manager or HR approval step',
    icon: '⚡',
    color: 'amber',
    formSchema: [
      {
        name: 'label',
        label: 'Approval Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Manager Approval',
        validation: { minLength: 2, maxLength: 50 },
      },
      {
        name: 'approverRole',
        label: 'Approver Role',
        type: 'select',
        required: true,
        options: [
          { label: 'Manager', value: 'manager' },
          { label: 'HR Business Partner', value: 'hrbp' },
          { label: 'Director', value: 'director' },
          { label: 'Finance', value: 'finance' },
        ],
      },
      {
        name: 'autoApproveThreshold',
        label: 'Auto-approve if amount < $',
        type: 'number',
        placeholder: '0',
      },
      {
        name: 'requiresComment',
        label: 'Require approval comment',
        type: 'boolean',
      },
    ],
    defaultData: {
      label: 'Approval',
      approverRole: 'manager',
      autoApproveThreshold: 0,
      requiresComment: false,
    },
    validate: (data) => {
      const errors: string[] = [];

      if (!data.label || (data.label as string).trim() === '') {
        errors.push('Approval name is required');
      }

      if (!data.approverRole) {
        errors.push('Approver role is required');
      }

      // FIX: guard against undefined before numeric comparison
      if (
        data.autoApproveThreshold !== undefined &&
        (data.autoApproveThreshold as number) < 0
      ) {
        errors.push('Auto-approve threshold cannot be negative');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
  },

  end: {
    component: EndNode,
    label: 'End',
    description: 'Workflow completion',
    icon: '■',
    color: 'red',
    formSchema: [
      {
        name: 'label',
        label: 'Completion Message',
        type: 'text',
        required: true,
        placeholder: 'e.g., Onboarding Complete',
        validation: { minLength: 2, maxLength: 50 },
      },
      {
        name: 'showSummary',
        label: 'Show workflow summary',
        type: 'boolean',
      },
    ],
    defaultData: {
      label: 'End',
      showSummary: false,
    },
    validate: (data) => {
      const errors: string[] = [];

      if (!data.label || (data.label as string).trim() === '') {
        errors.push('Completion message is required');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
  },
});

/**
 * Helper Functions - Use these to interact with the registry
 */

export function getNodeTypeOptions() {
  return Object.entries(nodeRegistry).map(([key, config]) => ({
    value: key as NodeTypeKey,
    label: config.label,
    icon: config.icon,
    description: config.description,
    color: config.color,
  }));
}

export function getNodeConfig(nodeType: NodeTypeKey): NodeTypeConfig {
  const config = nodeRegistry[nodeType];
  if (!config) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }
  return config;
}

export function getNodeComponent(nodeType: NodeTypeKey) {
  return getNodeConfig(nodeType).component;
}

export function getFormSchema(nodeType: NodeTypeKey): FormFieldConfig[] {
  return getNodeConfig(nodeType).formSchema;
}

export function validateNodeData(
  nodeType: NodeTypeKey,
  data: Record<string, unknown>
): { valid: boolean; errors?: string[] } {
  const config = getNodeConfig(nodeType);

  if (config.validate) {
    return config.validate(data);
  }

  return { valid: true };
}

export function createNodeInstance(
  nodeType: NodeTypeKey,
  overrides: Record<string, unknown> = {}
) {
  const config = getNodeConfig(nodeType);

  return {
    id: `${nodeType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: nodeType,
    // FIX: randomise position so nodes don't stack on top of each other
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    data: {
      ...config.defaultData,
      ...overrides,
    },
  };
}

export function getDefaultData(nodeType: NodeTypeKey): Record<string, unknown> {
  return { ...getNodeConfig(nodeType).defaultData };
}

export function isValidNodeType(nodeType: unknown): nodeType is NodeTypeKey {
  return typeof nodeType === 'string' && nodeType in nodeRegistry;
}

export function getAllNodeTypes(): NodeTypeKey[] {
  return Object.keys(nodeRegistry) as NodeTypeKey[];
}

export function getNodeTypesByColor(color: string): NodeTypeKey[] {
  return Object.entries(nodeRegistry)
    .filter(([_, config]) => config.color === color)
    .map(([key]) => key as NodeTypeKey);
}