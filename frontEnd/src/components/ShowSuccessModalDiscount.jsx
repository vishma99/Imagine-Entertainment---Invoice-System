import React from "react";

const ShowSuccessModalDiscount = ({
  show,
  onClose,
  onConfirm,
  quotationType,
  dynamicSystemsName,
  invoice,
  subTotal,
  subTotalLEDGroup,
  totalValueOfSupply,
  vat,
  grandTotal,
  vatYes,
  grandTotalYes,
  numberToWords,
  setInvoice,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ textAlign: "left", padding: "30px", maxWidth: "500px" }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "50px",
              color: "#2e7d32",
              marginBottom: "10px",
            }}
          >
            ✔️
          </div>
          <h3 style={{ color: "#1a237e", marginBottom: "20px" }}>
            Quotation Confirmation
          </h3>
        </div>

        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          {/* 1. Normal Quotation */}
          {quotationType === "Normal Quotation" && (
            <>
              <div
                className="info-row"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  margin: "10px 0",
                  padding: "10px",
                  backgroundColor: "#fff5f5",
                  borderRadius: "5px",
                  border: "1px solid #ffcdd2",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#d32f2f",
                  }}
                >
                  Update Special Discount for {dynamicSystemsName} (Imagine
                  items):
                </label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  {/* Percentage (%) Input */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="number"
                      value={invoice.discountLEDPercent || ""}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        const amt = (subTotalLEDGroup * pct) / 100;
                        setInvoice({
                          ...invoice,
                          discountLEDPercent: pct,
                          discountLED: amt,
                        });
                      }}
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />{" "}
                    <span>%</span>
                  </div>
                  {/* Rupees (Rs.) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Rs.</span>
                    <input
                      type="number"
                      value={invoice.discountLED || ""}
                      onChange={(e) => {
                        const amt = Number(e.target.value);
                        const pct =
                          subTotalLEDGroup > 0
                            ? (amt / subTotalLEDGroup) * 100
                            : 0;
                        setInvoice({
                          ...invoice,
                          discountLED: amt,
                          discountLEDPercent: parseFloat(pct.toFixed(2)),
                        });
                      }}
                      style={{
                        width: "120px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p>
                <strong>Grand Total Amount :</strong> Rs.{" "}
                {(subTotal - (invoice.discountLED || 0)).toLocaleString()}
              </p>
              <p>
                <strong>Wording :</strong>{" "}
                {numberToWords(
                  Math.round(subTotal - (invoice.discountLED || 0)),
                )}
              </p>
              <p>
                <strong>Mode of Payment :</strong> Cash
              </p>
            </>
          )}

          {/* 2. Normal Quotation with Discount */}
          {quotationType === "Normal Quotation with Discount" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  margin: "10px 0",
                  padding: "10px",
                  backgroundColor: "#fff5f5",
                  borderRadius: "5px",
                  border: "1px solid #ffcdd2",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#d32f2f",
                  }}
                >
                  Update Special Discount for {dynamicSystemsName} (Imagine
                  items):
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  {/* Percentage (%) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="number"
                      value={invoice.discountLEDPercent || ""}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        const amt = (subTotalLEDGroup * pct) / 100;
                        setInvoice({
                          ...invoice,
                          discountLEDPercent: pct,
                          discountLED: amt,
                        });
                      }}
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                    <span>%</span>
                  </div>

                  {/* Rupees (Rs.) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Rs.</span>
                    <input
                      type="number"
                      value={invoice.discountLED || ""}
                      onChange={(e) => {
                        const amt = Number(e.target.value);
                        const pct =
                          subTotalLEDGroup > 0
                            ? (amt / subTotalLEDGroup) * 100
                            : 0;
                        setInvoice({
                          ...invoice,
                          discountLED: amt,
                          discountLEDPercent: parseFloat(pct.toFixed(2)),
                        });
                      }}
                      style={{
                        width: "120px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p>
                <strong>Sub Total Amount :</strong> Rs.{" "}
                {(subTotal - invoice.discountLED).toLocaleString()}
              </p>
              {/* Discount Input Logic - මෙය Quotation with Discount පවතින අවස්ථා දෙකේම භාවිතා කරන්න */}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  margin: "10px 0",
                  padding: "10px",
                  backgroundColor: "#fff5f5",
                  borderRadius: "5px",
                  border: "1px solid #ffcdd2",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#d32f2f",
                  }}
                >
                  Update Special Discount:
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  {/* Percentage (%) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="number"
                      value={invoice.discountPercent || ""}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        // දැනට ඇති මුළු මුදලෙන් discount එක අඩු කළ පසු ලැබෙන අගය මත නව discount එක සෙවීම
                        const currentBalance =
                          subTotal - (invoice.discountLED || 0);
                        const amt = (currentBalance * pct) / 100;

                        setInvoice({
                          ...invoice,
                          discountPercent: pct,
                          discount: amt, // පරණ discount එකට අලුත් එක එකතු කිරීම හෝ වෙනත් logic එකක්
                        });
                      }}
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                    <span>%</span>
                  </div>

                  {/* Rupees (Rs.) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Rs.</span>
                    <input
                      type="number"
                      value={invoice.discount || ""}
                      onChange={(e) => {
                        const amt = Number(e.target.value);
                        const currentBalance =
                          subTotal - (invoice.discountLED || 0); // සාමාන්‍යයෙන් pct බලන්නේ මුල් මුදලට සාපේක්ෂවයි
                        const pct =
                          currentBalance > 0 ? (amt / currentBalance) * 100 : 0;

                        setInvoice({
                          ...invoice,
                          discount: amt,
                          discountPercent: parseFloat(pct.toFixed(2)),
                        });
                      }}
                      style={{
                        width: "120px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p style={{ borderTop: "1px solid #ccc", paddingTop: "5px" }}>
                <strong>Grand Total Amount :</strong> Rs.{" "}
                {(
                  subTotal -
                  (invoice.discountLED || 0) -
                  (invoice.discount || 0)
                ).toLocaleString()}
              </p>
              <p>
                <strong>Wording :</strong>{" "}
                {numberToWords(
                  Math.round(
                    subTotal -
                      (invoice.discountLED || 0) -
                      (invoice.discount || 0),
                  ),
                )}
              </p>
              <p>
                <strong>Mode of Payment :</strong> Cash
              </p>
            </>
          )}

          {/* 3. Vat Quotation */}
          {quotationType === "Vat Quotation" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  margin: "10px 0",
                  padding: "10px",
                  backgroundColor: "#fff5f5",
                  borderRadius: "5px",
                  border: "1px solid #ffcdd2",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#d32f2f",
                  }}
                >
                  Update Special Discount for {dynamicSystemsName} (Imagine
                  items):
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  {/* Percentage (%) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="number"
                      value={invoice.discountLEDPercent || ""}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        const amt = (subTotalLEDGroup * pct) / 100;
                        setInvoice({
                          ...invoice,
                          discountLEDPercent: pct,
                          discountLED: amt,
                        });
                      }}
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                    <span>%</span>
                  </div>

                  {/* Rupees (Rs.) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Rs.</span>
                    <input
                      type="number"
                      value={invoice.discountLED || ""}
                      onChange={(e) => {
                        const amt = Number(e.target.value);
                        const pct =
                          subTotalLEDGroup > 0
                            ? (amt / subTotalLEDGroup) * 100
                            : 0;
                        setInvoice({
                          ...invoice,
                          discountLED: amt,
                          discountLEDPercent: parseFloat(pct.toFixed(2)),
                        });
                      }}
                      style={{
                        width: "120px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p>
                <strong>Total Value of Supply :</strong> Rs.{" "}
                {(subTotal - invoice.discountLED).toLocaleString()}
              </p>
              <p>
                <strong>VAT Amount (18%) :</strong> Rs.{" "}
                {vatYes.toLocaleString()}
              </p>
              <p
                style={{
                  borderTop: "1px solid #ccc",
                  paddingTop: "5px",
                  fontWeight: "bold",
                }}
              >
                <strong>Total Amount Including VAT :</strong> Rs.{" "}
                {grandTotalYes.toLocaleString()}
              </p>
              <p>
                <strong>Total Amount wording :</strong>{" "}
                {numberToWords(Math.round(grandTotalYes))}
              </p>
              <p>
                <strong>Mode of Payment :</strong> cheque in favour of "Imagine
                Entertainment (Pvt) Ltd"
              </p>
            </>
          )}

          {/* 4. Vat Quotation with Discount */}
          {quotationType === "Vat Quotation with Discount" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  margin: "10px 0",
                  padding: "10px",
                  backgroundColor: "#fff5f5",
                  borderRadius: "5px",
                  border: "1px solid #ffcdd2",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#d32f2f",
                  }}
                >
                  Update Special Discount for {dynamicSystemsName} (Imagine
                  items) :
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  {/* Percentage (%) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="number"
                      value={invoice.discountLEDPercent || ""}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        const amt = (subTotalLEDGroup * pct) / 100;
                        setInvoice({
                          ...invoice,
                          discountLEDPercent: pct,
                          discountLED: amt,
                        });
                      }}
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                    <span>%</span>
                  </div>

                  {/* Rupees (Rs.) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Rs.</span>
                    <input
                      type="number"
                      value={invoice.discountLED || ""}
                      onChange={(e) => {
                        const amt = Number(e.target.value);
                        const pct =
                          subTotalLEDGroup > 0
                            ? (amt / subTotalLEDGroup) * 100
                            : 0;
                        setInvoice({
                          ...invoice,
                          discountLED: amt,
                          discountLEDPercent: parseFloat(pct.toFixed(2)),
                        });
                      }}
                      style={{
                        width: "120px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p>
                <strong>Sub Total Amount :</strong> Rs.{" "}
                {(subTotal - invoice.discountLED).toLocaleString()}
              </p>
              {/* Discount Input Logic - මෙය Quotation with Discount පවතින අවස්ථා දෙකේම භාවිතා කරන්න */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  margin: "10px 0",
                  padding: "10px",
                  backgroundColor: "#fff5f5",
                  borderRadius: "5px",
                  border: "1px solid #ffcdd2",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#d32f2f",
                  }}
                >
                  Update Special Discount:
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  {/* Percentage (%) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="number"
                      value={invoice.discountPercent || ""}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        // දැනට ඇති මුළු මුදලෙන් discount එක අඩු කළ පසු ලැබෙන අගය මත නව discount එක සෙවීම
                        const currentBalance =
                          subTotal - (invoice.discountLED || 0);
                        const amt = (currentBalance * pct) / 100;

                        setInvoice({
                          ...invoice,
                          discountPercent: pct,
                          discount: amt, // පරණ discount එකට අලුත් එක එකතු කිරීම හෝ වෙනත් logic එකක්
                        });
                      }}
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                    <span>%</span>
                  </div>

                  {/* Rupees (Rs.) Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Rs.</span>
                    <input
                      type="number"
                      value={invoice.discount || ""}
                      onChange={(e) => {
                        const amt = Number(e.target.value);
                        const currentBalance =
                          subTotal - (invoice.discountLED || 0); // සාමාන්‍යයෙන් pct බලන්නේ මුල් මුදලට සාපේක්ෂවයි
                        const pct =
                          currentBalance > 0 ? (amt / currentBalance) * 100 : 0;

                        setInvoice({
                          ...invoice,
                          discount: amt,
                          discountPercent: parseFloat(pct.toFixed(2)),
                        });
                      }}
                      style={{
                        width: "120px",
                        padding: "4px",
                        border: "1px solid #d32f2f",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p>
                <strong>Total Value of Supply :</strong> Rs.{" "}
                {(
                  subTotal -
                  (invoice.discountLED || 0) -
                  (invoice.discount || 0)
                ).toLocaleString()}
              </p>
              <p>
                <strong>VAT Amount (18%) :</strong> Rs.{" "}
                {(
                  (subTotal -
                    (invoice.discountLED || 0) -
                    (invoice.discount || 0)) *
                  0.18
                ).toLocaleString()}
              </p>
              <p
                style={{
                  borderTop: "1px solid #ccc",
                  paddingTop: "5px",
                  fontWeight: "bold",
                }}
              >
                <strong>Total Amount Including VAT :</strong> Rs.{" "}
                {(
                  subTotal -
                  (invoice.discountLED || 0) -
                  (invoice.discount || 0) +
                  (subTotal -
                    (invoice.discountLED || 0) -
                    (invoice.discount || 0)) *
                    0.18
                ).toLocaleString()}
              </p>
              <p>
                <strong>Total Amount wording :</strong>{" "}
                {numberToWords(
                  Math.round(
                    subTotal -
                      (invoice.discountLED || 0) -
                      (invoice.discount || 0) +
                      (subTotal -
                        (invoice.discountLED || 0) -
                        (invoice.discount || 0)) *
                        0.18,
                  ),
                )}
              </p>
              <p>
                <strong>Mode of Payment :</strong> cheque in favour of "Imagine
                Entertainment (Pvt) Ltd
              </p>
            </>
          )}
        </div>

        <div
          className="popup-actions"
          style={{
            justifyContent: "center",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <button
            className="btn-confirm-save"
            style={{
              backgroundColor: "#2e7d32",
              color: "white",
              padding: "10px 20px",
            }}
            onClick={onConfirm}
          >
            Yes, Save Now
          </button>
          <button className="btn-close" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
export default ShowSuccessModalDiscount;
