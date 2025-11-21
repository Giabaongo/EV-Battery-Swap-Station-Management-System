# Staff Manual Swap - Cabinet/Slot Integration Complete

## Summary

Integrated step-by-step battery swap dialog into ManualSwap.jsx, providing staff with cabinet/slot interaction similar to AutoSwapDialog. When staff clicks "Create Transaction", instead of a direct API call, they now go through 4 steps with visual cabinet/slot feedback.

## Files Created

### 1. **SwapStepsDialog.jsx** (New Component)

**Location**: `frontend/src/components/staff/SwapStepsDialog.jsx`

A reusable step-by-step dialog component for battery swaps with the following features:

#### Steps Implemented:

1. **RETURN_BATTERY** - Display empty slot location, staff places old battery
2. **CHECK_BATTERY_HEALTH** - Automatic battery health check (SOH >= 80%)
3. **COLLECT_BATTERY** - Display new battery location, staff takes it
4. **SWAP_SUCCESS** - Show transaction confirmation with ID and details

#### Key Features:

- **Cabinet/Slot Display**: Shows exact cabinet and slot numbers at each step
- **Battery Health Validation**: Automatic SOH check with pass/fail handling
- **Error Handling**: Graceful error messages for each operation
- **Loading States**: Proper feedback during API calls
- **Success Screen**: Transaction details displayed at completion
- **State Management**: Automatic reset when dialog closes

#### Service Methods Used:

- `swappingService.getEmptySlot()` - Get available empty slot
- `swappingService.returnBattery()` - Place old battery in slot
- `batteryService.checkBatteryHealth()` - Validate battery SOH
- `swappingService.getFullSlot()` - Get available charged battery
- `swappingService.takeBattery()` - Extract new battery
- `swappingService.swapBatteries()` - Complete transaction

#### Props Interface:

```javascript
{
    open: boolean,                    // Dialog visibility
    onOpenChange: (bool) => void,    // Handle dialog open/close
    userId: number,                   // Customer ID
    vehicleId: number,                // Vehicle ID
    stationId: number,                // Station ID (from staff)
    currentBatteryId: string,         // Old battery to return
    onSuccess: (transaction) => void  // Callback after swap
}
```

## Files Modified

### 1. **ManualSwap.jsx** (Updated)

**Location**: `frontend/src/pages/staff/ManualSwap.jsx`

#### Changes Made:

1. **Import Addition**:

   ```javascript
   import SwapStepsDialog from "../../components/staff/SwapStepsDialog";
   ```

2. **State Variables Added**:

   ```javascript
   const [swapDialogOpen, setSwapDialogOpen] = useState(false);
   const [swapFormData, setSwapFormData] = useState(null);
   ```

3. **handleSubmit Logic Refactored**:

   - **Old Behavior**: Direct `swappingService.swapBatteries()` API call
   - **New Behavior**: Validates form → stores data → opens StepDialog
   - Form validation still occurs (user_id, vehicle_id, station_id required)
   - Dialog now handles the actual swap through steps

4. **New Handler Added**:

   ```javascript
   const handleSwapSuccess = async (transaction) => {
     // Refresh batteries
     // Close modal
     // Clear form
     // Navigate back to swap-requests
   };
   ```

5. **Dialog Component Integration**:

   - Added `<SwapStepsDialog>` before closing div
   - Passes form data: userId, vehicleId, stationId, currentBatteryId
   - Calls `handleSwapSuccess` on transaction completion

6. **Imports Cleaned**:
   - Removed unused `swappingService` (now in SwapStepsDialog)
   - Removed unused `toast` (handled in SwapStepsDialog)
   - Removed unused `mapServerErrorToMessage` function

## Flow Diagram

### Luồng 1 (From Process Request):

```
Process Request List
    ↓
[Create Transaction] button
    ↓
ManualSwap.jsx loads with prefilled data
    ↓
Staff reviews: User, Vehicle, Station, Subscription
    ↓
[Create Transaction] button click
    ↓
Form validation
    ↓
SwapStepsDialog opens ← Dialog takes control
    ↓
Step 1: Return Battery (empty slot shown)
Step 2: Check Health (battery validated)
Step 3: Collect Battery (full slot shown)
Step 4: Success (transaction confirmed)
    ↓
onSuccess callback → Closes modal → Back to swap-requests
```

### Luồng 2 (Manual Email Search):

```
ManualSwap page
    ↓
[Create Manual Swap] button
    ↓
Enter email → Search
    ↓
Select vehicle from dropdown
    ↓
System auto-fills: subscription, station
    ↓
[Create Transaction] click
    ↓
Same dialog flow as Luồng 1 (steps 1-4)
```

## User Experience Improvements

### Before:

- Direct API call without user feedback
- No cabinet/slot information
- Potential "Cannot POST" error (400 validation mismatch)
- No visual confirmation of battery locations

### After:

- Clear step-by-step process
- Visual cabinet/slot numbers at each step
- Battery health validation with pass/fail
- Loading states and error messages
- Transaction confirmation screen
- Better UX alignment with customer AutoSwapDialog

## Technical Implementation Details

### Station ID Handling:

- Automatically uses `staffUser.station_id` from logged-in user
- No station selection step needed (unlike customer AutoSwapDialog)
- Pre-filled in form, passed to dialog

### Battery ID Handling:

- Old battery ID from vehicle: `vehicle.battery_id`
- New battery ID auto-selected by `getFullSlot()`
- Validated for health before extraction

### Error Scenarios Handled:

1. **No empty slot available** → Error at step 1
2. **Battery SOH < 80%** → Fail at step 2, return to step 1
3. **No charged battery available** → Error at step 3
4. **Swap transaction fails** → Error at step 4

### Success Flow:

- Refreshes battery list via `getAllBatteries()`
- Closes ManualSwap modal
- Clears form for next transaction
- Navigates to `/staff/swap-requests`

## Code Quality

### Error Handling:

✅ Try-catch blocks for each service call
✅ Descriptive error messages
✅ Graceful state resets
✅ No infinite loops

### State Management:

✅ Clean state initialization
✅ Proper cleanup on dialog close
✅ No memory leaks from intervals/timers
✅ FormData stored only when needed

### Accessibility:

✅ Proper button states (disabled during loading)
✅ Loading spinners for visual feedback
✅ Error messages in red-highlighted boxes
✅ Semantic HTML structure

### UI/UX:

✅ Consistent with existing design
✅ ShadCN UI components
✅ Lucide icons
✅ Tailwind styling
✅ Responsive layout

## Testing Checklist

### Luồng 1 (From Reservation):

- [ ] Process request displays ManualSwap with prefilled data
- [ ] All fields populated correctly (user, vehicle, station)
- [ ] Click "Create Transaction" opens dialog
- [ ] Step 1: Cabinet/slot displays correctly
- [ ] Place battery and proceed
- [ ] Step 2: Battery health passes
- [ ] Step 3: New battery cabinet/slot displays
- [ ] Take battery and proceed
- [ ] Step 4: Transaction success with ID
- [ ] Modal closes, back to swap-requests

### Luồng 2 (Manual):

- [ ] Email search finds user
- [ ] Vehicle dropdown shows user's vehicles
- [ ] Select vehicle, subscription auto-fills
- [ ] Click "Create Transaction" opens dialog
- [ ] Same 4 steps execute successfully
- [ ] Modal closes on success

### Error Cases:

- [ ] No empty slot → Shows error at step 1
- [ ] Battery SOH < 80% → Shows fail screen, can retry
- [ ] No charged battery → Shows error at step 3
- [ ] Network error → Shows error message, user can close and retry

## Notes for Backend Team

### Expected API Payloads:

**getEmptySlot**:

```json
{
  "user_id": 2,
  "vehicle_id": 5,
  "station_id": 1
}
```

Expected response: `{ cabinet_id, slot_id, ... }`

**returnBattery**:

```json
{
  "cabinet_id": 1,
  "slot_id": 2,
  "battery_id": "BAT002"
}
```

**checkBatteryHealth**:

```json
Battery ID: "BAT005"
```

Expected response: `{ soh: 85, status: "good", ... }`

**getFullSlot**:

```json
{
  "user_id": 2,
  "vehicle_id": 5,
  "station_id": 1
}
```

Expected response: `{ cabinet_id, slot_id, battery_id, ... }`

**takeBattery**:

```json
{
  "cabinet_id": 1,
  "slot_id": 3
}
```

**swapBatteries**:

```json
{
  "user_id": 2,
  "vehicle_id": 5,
  "station_id": 1,
  "battery_taken_id": "BAT005",
  "subscription_battery_returned_id": "BAT002"
}
```

## Summary of Changes

| Aspect                   | Before                 | After                                   |
| ------------------------ | ---------------------- | --------------------------------------- |
| Submit Behavior          | Direct API call        | Multi-step dialog                       |
| User Feedback            | Minimal                | Step-by-step with visuals               |
| Cabinet/Slot Info        | Not shown              | Displayed at each step                  |
| Battery Validation       | None                   | Automatic SOH check                     |
| Error Recovery           | None                   | Retry options                           |
| Transaction Confirmation | Simple                 | Detailed success screen                 |
| Time to Complete         | 1 second (if no error) | ~10-15 seconds (with user interactions) |

## Next Steps

1. **Test** both Luồng 1 and Luồng 2 flows
2. **Verify** all service endpoints return correct data
3. **Monitor** error handling in production
4. **Gather** user feedback on UX
5. **Consider** future enhancements (e.g., notes/remarks per swap)
