export function EmployeeMultiSelect({
  employees,
  selectedIds,
  excludedIds = [],
  onChange,
  label = 'Nguoi ho tro'
}) {
  const excluded = new Set(excludedIds.filter(Boolean));
  const selected = new Set(selectedIds || []);
  const options = employees.filter((employee) => !excluded.has(employee.id));

  const toggle = (employeeId) => {
    const next = new Set(selected);
    if (next.has(employeeId)) {
      next.delete(employeeId);
    } else {
      next.add(employeeId);
    }
    onChange([...next]);
  };

  return (
    <fieldset className="employee-multi-select">
      <legend>{label}</legend>
      <div>
        {options.map((employee) => (
          <label className={selected.has(employee.id) ? 'selected' : ''} key={employee.id}>
            <input
              type="checkbox"
              checked={selected.has(employee.id)}
              onChange={() => toggle(employee.id)}
            />
            <span className="avatar small">{employee.email.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{employee.email}</strong>
              <small>{employee.position || employee.role}</small>
            </span>
          </label>
        ))}
      </div>
      {!options.length && <small>Chua co nhan su khac trong danh ba Marketing.</small>}
    </fieldset>
  );
}
