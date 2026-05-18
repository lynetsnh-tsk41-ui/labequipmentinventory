# 0003. Routing, State, and Data Model

## Context
The application features two main views (Equipment List and History Log) and needs to track equipment items and log entries.

## Decision
- **Routing:** Simple conditional CSS display toggling for tabs (Inventory vs History) to keep it as a true single-page application without URL manipulation complexity.
- **State Management:** A centralized `State` class/object (`state.js`) using the Observer pattern or simple event callbacks to notify the UI of data changes and persist to `LocalStorage`.
- **Data Models:**
  - `Equipment`: `{ id, name, inventoryNumber, category, description?, status (Available | Issued | Maintenance), currentAssignee?, createdAt, updatedAt }`
  - `LogEntry`: `{ id, equipmentId, equipmentName, actionType, details, timestamp }`

## Options Considered
- Using `hash` routing: Too complex for just two tabs.
- Custom Event Bus: Overkill, direct callbacks from state to UI rendering functions are simpler.

## Consequences
- Very lightweight architecture with clear separation of concerns (State vs UI).
- Easily testable data model.
