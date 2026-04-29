import React from "react";

const ShowSuccessModal = ({
  show,
  onClose,
  onConfirm,
  quotationType,

  invoice,
  subTotal,
 finalPayable,
 finalAllpayable,
  totalValueOfSupply,
  vat,
  grandTotal,

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
              <p>
                <strong>Grand Total Amount :</strong> Rs.{" "}
                {subTotal.toLocaleString()}
              </p>
              <p>
                <strong>Wording :</strong> {numberToWords(Math.round(subTotal))}
              </p>
              <p>
                <strong>Mode of Payment :</strong> Cash
              </p>
            </>
          )}

          {/* 2. Normal Quotation with Discount */}
          {quotationType === "Normal Quotation with Discount" && (
            <>
              <p>
                <strong>Sub Total Amount :</strong> Rs.{" "}
                {subTotal.toLocaleString()}
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
                        const amt = (subTotal * pct) / 100;
                        setInvoice({
                          ...invoice,
                          discountPercent: pct,
                          discount: amt,
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
                        const pct = subTotal > 0 ? (amt / subTotal) * 100 : 0;
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
                {totalValueOfSupply.toLocaleString()}
              </p>
              <p>
                <strong>Wording :</strong>{" "}
                {numberToWords(Math.round(totalValueOfSupply))}
              </p>
              <p>
                <strong>Mode of Payment :</strong> Cash
              </p>
            </>
          )}

          {/* 3. Vat Quotation */}
          {quotationType === "Vat Quotation" && (
            <>
              <p>
                <strong>Total Value of Supply :</strong> Rs.{" "}
                {subTotal.toLocaleString()}
              </p>
              <p>
                <strong>VAT Amount (18%) :</strong> Rs. {vat.toLocaleString()}
              </p>
              <p
                style={{
                  borderTop: "1px solid #ccc",
                  paddingTop: "5px",
                  fontWeight: "bold",
                }}
              >
                <strong>Total Amount Including VAT :</strong> Rs.{" "}
                {grandTotal.toLocaleString()}
              </p>
              <p>
                <strong>Total Amount wording :</strong>{" "}
                {numberToWords(Math.round(grandTotal))}
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
              <p>
                <strong>Sub Total Amount :</strong> Rs.{" "}
                {subTotal.toLocaleString()}
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
                        const amt = (subTotal * pct) / 100;
                        setInvoice({
                          ...invoice,
                          discountPercent: pct,
                          discount: amt,
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
                        const pct = subTotal > 0 ? (amt / subTotal) * 100 : 0;
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
                {totalValueOfSupply.toLocaleString()}
              </p>
              <p>
                <strong>VAT Amount (18%) :</strong> Rs. {vat.toLocaleString()}
              </p>
              <p
                style={{
                  borderTop: "1px solid #ccc",
                  paddingTop: "5px",
                  fontWeight: "bold",
                }}
              >
                <strong>Total Amount Including VAT :</strong> Rs.{" "}
                {grandTotal.toLocaleString()}
              </p>
              <p>
                <strong>Total Amount wording :</strong>{" "}
                {numberToWords(Math.round(grandTotal))}
              </p>
              <p>
                <strong>Mode of Payment :</strong> cheque in favour of "Imagine
                Entertainment (Pvt) Ltd
              </p>
            </>
          )}

          {quotationType === "Vat Quotation More Days" && (
            <>
              <div className="info-row">
                <strong>Total Value of Supply :</strong>
                <span className="info-value">
                  Rs.{" "}
                  {finalAllpayable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="info-row">
                <strong>VAT Amount (18%) :</strong>
                <span className="info-value">
                  {/* finalAllpayable මත 18% ක් ගණනය කිරීම */}
                  Rs.{" "}
                  {(finalAllpayable * 0.18).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div
                className="info-row"
                style={{
                  borderTop: "1px solid #ccc",
                  paddingTop: "5px",
                  fontWeight: "bold",
                }}
              >
                <strong>Total Amount Including VAT :</strong>
                <span className="info-value" style={{ color: "#2e7d32" }}>
                  {/* finalAllpayable + එහි VAT එකතුව */}
                  Rs.{" "}
                  {(finalAllpayable * 0.18 + finalAllpayable).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                    },
                  )}
                </span>
              </div>

              <div className="info-row">
                <strong>Total Amount wording :</strong>
                <span className="info-value">
                  {numberToWords(
                    Math.round(finalAllpayable * 0.18 + finalAllpayable),
                  )}
                </span>
              </div>

              <div
                className="info-row"
                style={{ borderBottom: "none", marginTop: "10px" }}
              >
                <strong>Mode of Payment :</strong>
                <span className="info-value">
                  cheque in favour of "Imagine Entertainment (Pvt) Ltd"
                </span>
              </div>
            </>
          )}

          {quotationType === "Normal Quotation More Days" && (
            <>
              <p>
                <strong>Grand Total Amount :</strong> Rs.{" "}
                {finalAllpayable.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p>
                <strong>Wording :</strong>{" "}
                {numberToWords(Math.round(finalAllpayable))}
              </p>
              <p>
                <strong>Mode of Payment :</strong> Cash
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
export default ShowSuccessModal;
