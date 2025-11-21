// Example: Cách sử dụng BatterySelectionModal trong các component khác

import React, { useState } from "react";
import BatterySelectionModal from "./BatterySelectionModal";

function ExampleUsage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [requiredQty, setRequiredQty] = useState(50);

  const handleOpenModal = (ticketId, quantity) => {
    setSelectedTicketId(ticketId);
    setRequiredQty(quantity);
    setShowModal(true);
  };

  const handleBatteryConfirm = async (selectedBatteryIds) => {
    console.log("Selected batteries:", selectedBatteryIds);
    // TODO: Send to backend or parent component
    setShowModal(false);
  };

  return (
    <div>
      {/* Your component content */}

      {/* Modal */}
      <BatterySelectionModal
        isOpen={showModal}
        ticketId={selectedTicketId}
        requiredQuantity={requiredQty}
        onClose={() => {
          setShowModal(false);
          setSelectedTicketId(null);
        }}
        onConfirm={handleBatteryConfirm}
      />
    </div>
  );
}

export default ExampleUsage;

/**
 * Cách integrate vào component khác:
 *
 * 1. Import modal:
 *    import BatterySelectionModal from './BatterySelectionModal'
 *
 * 2. Tạo state để quản lý modal:
 *    const [showBatteryModal, setShowBatteryModal] = useState(false)
 *    const [selectedTransfer, setSelectedTransfer] = useState(null)
 *
 * 3. Tạo handler để mở modal:
 *    const handleOpenBatterySelection = (transfer) => {
 *        setSelectedTransfer(transfer)
 *        setShowBatteryModal(true)
 *    }
 *
 * 4. Tạo handler để confirm:
 *    const handleBatterySelectionConfirm = async (batteryIds) => {
 *        // Call API with batteryIds
 *        await api.updateTransfer(selectedTransfer.id, {
 *            selected_batteries: batteryIds,
 *            status: 'dispatched'
 *        })
 *        setShowBatteryModal(false)
 *        setSelectedTransfer(null)
 *    }
 *
 * 5. Thêm modal vào JSX:
 *    {selectedTransfer && (
 *        <BatterySelectionModal
 *            isOpen={showBatteryModal}
 *            ticketId={selectedTransfer.id}
 *            requiredQuantity={selectedTransfer.quantity}
 *            onClose={() => {
 *                setShowBatteryModal(false)
 *                setSelectedTransfer(null)
 *            }}
 *            onConfirm={handleBatterySelectionConfirm}
 *        />
 *    )}
 */
