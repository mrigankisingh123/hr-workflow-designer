import React, { useState, useEffect } from 'react';

import type { Node } from 'reactflow';
import { getFormSchema, validateNodeData } from '../nodes/registry';
import type { NodeTypeKey } from '../nodes/registry';
interface Props {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: any) => void;
}

const styles = {
  emptyPanel: {
    width: 320,
    backgroundColor: '#fff',
    borderLeft: '1px solid #e5e7eb',
    padding: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    height: '100%',
  },
  emptyText: {
    textAlign: 'center' as const,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: 500,
    margin: 0,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  panel: {
    width: 320,
    backgroundColor: '#fff',
    borderLeft: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    padding: 16,
    background: 'linear-gradient(to right, #f9fafb, #fff)',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  headerId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    margin: 0,
  },
  validationBannerError: {
    padding: '8px 16px',
    borderBottom: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
  },
  validationBannerSuccess: {
    padding: '8px 16px',
    borderBottom: '1px solid #bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  validationInnerError: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#b91c1c',
    fontWeight: 500,
  },
  validationInnerSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#15803d',
    fontWeight: 500,
  },
  formBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  emptyFields: {
    textAlign: 'center' as const,
    padding: '32px 0',
    color: '#6b7280',
    fontSize: 14,
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
  },
  required: {
    color: '#ef4444',
    marginLeft: 4,
  },
  inputBase: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
  },
  inputNormal: {
    border: '1px solid #d1d5db',
  },
  inputError: {
    border: '1px solid #ef4444',
  },
  checkboxWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    padding: '8px 0',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: '#2563eb',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
  },
  errorMsg: {
    fontSize: 12,
    color: '#dc2626',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    padding: 16,
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  autosaveBadge: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fffbeb',
    padding: '6px 12px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footerMeta: {
    fontSize: 12,
    color: '#4b5563',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  footerMetaLabel: {
    fontWeight: 500,
  },
};

function getNodeIcon(type: string | undefined) {
  switch (type) {
    case 'start': return '▶';
    case 'task': return '✓';
    case 'approval': return '⚡';
    case 'automatedStep': return '⚙';
    default: return '■';
  }
}

export default function NodeFormPanel({ selectedNode, onUpdateNode }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <div style={styles.emptyPanel}>
        <div style={styles.emptyText}>
          <div style={styles.emptyIcon}>📋</div>
          <p style={styles.emptyTitle}>No node selected</p>
          <p style={styles.emptySubtitle}>Click a node on the canvas to edit</p>
        </div>
      </div>
    );
  }

  const schema = getFormSchema(selectedNode.type as NodeTypeKey);

  const handleChange = (name: string, value: any) => {
    setIsDirty(true);

    const updatedData = { ...selectedNode.data, [name]: value };
    onUpdateNode(selectedNode.id, updatedData);

    const validationResult = validateNodeData(
      selectedNode.type as NodeTypeKey,
      updatedData
    );

    if (!validationResult.valid && validationResult.errors) {
      const fieldErrors: Record<string, string> = {};
      validationResult.errors.forEach((error) => {
        if (error.toLowerCase().includes(name.toLowerCase())) {
          fieldErrors[name] = error;
        }
      });
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const validationResult = validateNodeData(
    selectedNode.type as NodeTypeKey,
    selectedNode.data
  );

  const hasErrors = !validationResult.valid;
  const allFieldsTouched = schema.every((field) => touched[field.name]);
  const showValidationStatus = isDirty && allFieldsTouched;

  const inputStyle = (hasError: boolean | undefined) => ({
    ...styles.inputBase,
    ...(hasError ? styles.inputError : styles.inputNormal),
  });

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.headerIcon}>{getNodeIcon(selectedNode.type)}</span>
          <h3 style={styles.headerTitle}>
            {selectedNode.data.label || `${selectedNode.type} Node`}
          </h3>
        </div>
        <p style={styles.headerId}>{selectedNode.id}</p>
      </div>

      {/* Validation Status */}
      {showValidationStatus && (
        <div style={hasErrors ? styles.validationBannerError : styles.validationBannerSuccess}>
          <div style={hasErrors ? styles.validationInnerError : styles.validationInnerSuccess}>
            <span>{hasErrors ? '⚠️' : '✓'}</span>
            <span>{hasErrors ? 'Validation errors' : 'All fields valid'}</span>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div style={styles.formBody}>
        {schema.length === 0 ? (
          <div style={styles.emptyFields}>
            <p>No fields to configure</p>
          </div>
        ) : (
          schema.map((field) => {
            const value = selectedNode.data[field.name];
            const error = errors[field.name];
            const isTouched = touched[field.name];
            const hasError = !!(error && isTouched);

            return (
              <div key={field.name} style={styles.fieldWrapper}>
                {/* Label — skipped for boolean since it's inline */}
                {field.type !== 'boolean' && (
                  <label style={styles.label}>
                    {field.label}
                    {field.required && <span style={styles.required}>*</span>}
                  </label>
                )}

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    onBlur={() => handleBlur(field.name)}
                    placeholder={field.placeholder}
                    style={inputStyle(hasError)}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={value || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    onBlur={() => handleBlur(field.name)}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{ ...inputStyle(hasError), resize: 'none' }}
                  />
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    onBlur={() => handleBlur(field.name)}
                    style={inputStyle(hasError)}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => handleChange(field.name, e.target.valueAsNumber)}
                    onBlur={() => handleBlur(field.name)}
                    placeholder={field.placeholder}
                    style={inputStyle(hasError)}
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={value || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    onBlur={() => handleBlur(field.name)}
                    style={{ ...inputStyle(hasError), backgroundColor: '#fff' }}
                  >
                    <option value="">-- Select --</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'boolean' && (
                  <label style={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={value || false}
                      onChange={(e) => handleChange(field.name, e.target.checked)}
                      onBlur={() => handleBlur(field.name)}
                      style={styles.checkbox}
                    />
                    <span style={styles.checkboxLabel}>{field.label}</span>
                  </label>
                )}

                {hasError && (
                  <p style={styles.errorMsg}>
                    <span>⚠️</span>
                    {error}
                  </p>
                )}

                {field.validation && !hasError && (
                  <p style={styles.hint}>
                    {field.validation.minLength && (
                      <span>Min {field.validation.minLength} chars</span>
                    )}
                    {field.validation.maxLength && (
                      <span>Max {field.validation.maxLength} chars</span>
                    )}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        {isDirty && (
          <p style={styles.autosaveBadge}>
            <span>💾</span>
            Changes auto-saved
          </p>
        )}
        <div style={styles.footerMeta}>
          <p>
            <span style={styles.footerMetaLabel}>Node Type: </span>
            <span style={{ textTransform: 'capitalize' }}>{selectedNode.type}</span>
          </p>
          <p>
            <span style={styles.footerMetaLabel}>Position: </span>
            <span>
              ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}