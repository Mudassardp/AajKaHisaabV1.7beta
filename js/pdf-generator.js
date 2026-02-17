// PDF Generator for HisaabKitaab v4.1 - Supports Equal Split & Optimized Settlements
(function() {
    'use strict';
    
    // Helper function to generate avatar initials
    function generateAvatarInitials(name) {
        if (!name) return '?';
        
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    }
    
    // Helper function to generate consistent avatar color
    function generateAvatarColor(name) {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
            '#9b59b6', '#1abc9c', '#d35400', '#34495e',
            '#8e44ad', '#27ae60', '#c0392b', '#16a085'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }
    
    // Main PDF generation function
    window.generateExpensePDF = function(currentSheetData, selectedParticipants, isAdmin) {
        if (!currentSheetData) {
            alert('No sheet data available');
            return;
        }
        
        // Show loading
        if (window.showPDFLoading) {
            window.showPDFLoading();
        }
        
        try {
            // Create PDF content
            const pdfContent = createPDFContent(currentSheetData, selectedParticipants, isAdmin);
            
            // Generate PDF options
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `${currentSheetData.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                    backgroundColor: '#ffffff' // Force white background
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };
            
            // Generate and download PDF
            html2pdf().set(opt).from(pdfContent).toPdf().get('pdf').then(function(pdf) {
                // Add page numbers
                const totalPages = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(8);
                    pdf.setTextColor(100);
                    pdf.text(`Page ${i} of ${totalPages}`, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 10);
                }
            }).save().then(() => {
                console.log('PDF generated successfully');
            }).catch(error => {
                console.error('PDF generation error:', error);
                alert('Error generating PDF: ' + error.message);
            }).finally(() => {
                // Hide loading
                if (window.hidePDFLoading) {
                    window.hidePDFLoading();
                }
                // Clean up
                if (pdfContent.parentNode) {
                    pdfContent.remove();
                }
            });
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF: ' + error.message);
            if (window.hidePDFLoading) {
                window.hidePDFLoading();
            }
        }
    };
    
    function createPDFContent(currentSheetData, selectedParticipants, isAdmin) {
        // Create container with forced light mode styling
        const pdfContainer = document.createElement('div');
        pdfContainer.style.cssText = `
            padding: 20px;
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #333333 !important;
            line-height: 1.4;
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff !important;
            box-sizing: border-box;
        `;
        
        // Determine version and split type
        const version = currentSheetData.version || 'v3.0';
        const isV4 = version === 'v4.0';
        const isEqualSplit = isV4 || currentSheetData.splitType === 'equal';
        
        // Calculate totals
        let totalSpent = 0;
        selectedParticipants.forEach(participant => {
            totalSpent += currentSheetData.expenses[participant].spent || 0;
        });
        
        // Calculate per person share for v4.0
        const perPersonShare = isEqualSplit && selectedParticipants.length > 0 
            ? totalSpent / selectedParticipants.length 
            : (currentSheetData.perPersonShare || currentSheetData.costPerMeal || 0);
        
        // Format date for display
        function formatDateTime(date) {
            if (!date) return 'Unknown';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            return `${year}/${month}/${day} ${hours}:${minutes}`;
        }
        
        const displayDate = currentSheetData.lastUpdated ? 
                          formatDateTime(currentSheetData.lastUpdated) : 
                          currentSheetData.date ? 
                          formatDateTime(currentSheetData.date) : 
                          formatDateTime(currentSheetData.createdAt);
        
        // Add published status indicator
        let publishedStatus = '';
        if (currentSheetData.published) {
            publishedStatus = '<div style="background-color: #e8f6f3; color: #27ae60; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-left: 10px; border: 1px solid #27ae60;">📢 Published</div>';
        } else {
            publishedStatus = '<div style="background-color: #fef9e7; color: #f39c12; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-left: 10px; border: 1px solid #f39c12;">🔒 Unpublished</div>';
        }
        
        // Add version indicator
        const versionColor = isV4 ? '#9b59b6' : '#7f8c8d';
        const versionText = isV4 ? 'Equal Split' : 'Meals-based Split';
        const versionIndicator = `<span style="background-color: ${versionColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; margin-left: 10px;">${version} - ${versionText}</span>`;
        
        // Header Section
        const header = `
            <div style="text-align: center; border-bottom: 2px solid ${isV4 ? '#9b59b6' : '#3498db'}; padding-bottom: 15px; margin-bottom: 20px; page-break-after: avoid;">
                <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 5px; font-weight: bold;">HisaabKitaabApp ${version}</h1>
                <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 15px;">${isV4 ? 'Equal Split Expense Management' : 'Expense Management System'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa; padding: 10px 15px; border-radius: 5px; border-left: 4px solid ${isV4 ? '#9b59b6' : '#3498db'};">
                    <div style="display: flex; align-items: center; flex-wrap: wrap;">
                        <strong style="color: #2c3e50; font-size: 16px;">${currentSheetData.name || 'Unnamed Sheet'}</strong>
                        ${versionIndicator}
                        ${publishedStatus}
                    </div>
                    <span style="color: #7f8c8d; font-size: 12px;">Updated: ${displayDate}</span>
                </div>
            </div>
        `;
        
        // Summary Section
        const summarySection = `
            <div style="margin-bottom: 20px; page-break-after: avoid;">
                <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px; font-weight: bold;">Expense Summary</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <tr>
                        <td style="padding: 6px 8px; border-bottom: 1px solid #eaeaea; font-weight: 600; color: #2c3e50; width: 60%;">Total Participants:</td>
                        <td style="padding: 6px 8px; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold; color: #2c3e50;">${selectedParticipants.length}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 8px; border-bottom: 1px solid #eaeaea; font-weight: 600; color: #2c3e50;">Total Spent:</td>
                        <td style="padding: 6px 8px; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold; color: #2c3e50;">${totalSpent.toFixed(2)} SAR</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 8px; border-bottom: 1px solid #eaeaea; font-weight: 600; color: #2c3e50;">${isV4 ? 'Per Person Share:' : 'Cost Per Meal:'}</td>
                        <td style="padding: 6px 8px; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold; color: #2c3e50;">${perPersonShare.toFixed(2)} SAR</td>
                    </tr>
                </table>
            </div>
        `;
        
        // Individual Shares Section - NO MEALS COLUMN for v4.0
        let sharesSection = `
            <div style="margin-bottom: 20px; page-break-after: avoid;">
                <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px; font-weight: bold;">Individual Shares</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e0e0e0; page-break-inside: avoid;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 8px 10px; text-align: left; font-weight: bold; color: #2c3e50; border-bottom: 2px solid ${isV4 ? '#9b59b6' : '#3498db'};">Participant</th>
                            <th style="padding: 8px 10px; text-align: right; font-weight: bold; color: #2c3e50; border-bottom: 2px solid ${isV4 ? '#9b59b6' : '#3498db'};">Spent (SAR)</th>
                            <th style="padding: 8px 10px; text-align: right; font-weight: bold; color: #2c3e50; border-bottom: 2px solid ${isV4 ? '#9b59b6' : '#3498db'};">${isV4 ? 'Balance (SAR)' : 'To Be Paid (SAR)'}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        selectedParticipants.forEach(participant => {
            const expense = currentSheetData.expenses[participant] || { spent: 0, toBePaid: 0 };
            const balance = expense.toBePaid;
            const balanceColor = balance > 0 ? '#e74c3c' : balance < 0 ? '#27ae60' : '#2c3e50';
            const balanceSign = balance > 0 ? '+' : '';
            const avatarColor = generateAvatarColor(participant);
            const avatarInitials = generateAvatarInitials(participant);
            
            sharesSection += `
                        <tr>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; flex-shrink: 0;">
                                        ${avatarInitials}
                                    </div>
                                    <span>${participant}</span>
                                </div>
                            </td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600;">${expense.spent.toFixed(2)}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600; color: ${balanceColor};">${balanceSign}${balance.toFixed(2)}</td>
                        </tr>
            `;
        });
        
        // Total row
        sharesSection += `
                        <tr style="background-color: #e8f4fc; font-weight: bold;">
                            <td style="padding: 8px 10px; border-top: 2px solid ${isV4 ? '#9b59b6' : '#3498db'};">Total</td>
                            <td style="padding: 8px 10px; border-top: 2px solid ${isV4 ? '#9b59b6' : '#3498db'}; text-align: right;">${totalSpent.toFixed(2)}</td>
                            <td style="padding: 8px 10px; border-top: 2px solid ${isV4 ? '#9b59b6' : '#3498db'}; text-align: right;">0.00</td>
                        </tr>
                    </tbody>
                </table>
                ${isV4 ? '<p style="font-size: 11px; color: #9b59b6; margin-top: 5px; font-style: italic;">Positive (+) = Owes money • Negative (-) = To be refunded</p>' : ''}
            </div>
        `;
        
        // Settlements Section
        let settlementsSection = `
            <div style="margin-bottom: 20px; page-break-before: always; padding-top: 20px;">
                <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px; font-weight: bold;">Settlement Instructions</h2>
        `;
        
        // Add optimization note for v4.0
        if (isV4) {
            settlementsSection += `
                <div style="background-color: #e8f4fc; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 3px solid #9b59b6;">
                    <p style="margin: 0; color: #2c3e50; font-weight: 600; font-size: 13px;">
                        ✅ OPTIMIZED SETTLEMENTS: Each person pays only ONE person
                    </p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                        Total participants: ${selectedParticipants.length} • Equal share: ${perPersonShare.toFixed(2)} SAR per person
                    </p>
                </div>
            `;
        }
        
        const settlements = currentSheetData.settlements ? Object.values(currentSheetData.settlements) : [];
        
        if (settlements.length === 0) {
            settlementsSection += `
                <div style="text-align: center; color: #7f8c8d; font-style: italic; padding: 20px; background-color: #f8f9fa; border-radius: 5px; border: 1px dashed #ddd;">
                    All balances are settled! 🎉
                </div>
            `;
        } else {
            settlements.forEach(settlement => {
                const statusColor = settlement.status === 'paid' ? '#27ae60' : '#e74c3c';
                const statusBg = settlement.status === 'paid' ? '#e8f6f3' : '#fdedec';
                const statusText = settlement.status === 'paid' ? 'Paid' : 'Not Paid';
                
                // Add bank match indicator if applicable
                let bankMatchHtml = '';
                if (settlement.bankMatch && settlement.bank) {
                    let preferredText = '';
                    if (settlement.preferredMatch) {
                        preferredText = ' (Preferred)';
                    }
                    bankMatchHtml = `
                        <div style="margin-top: 5px; font-size: 11px; color: #666; font-style: italic;">
                            Same Bank: ${settlement.bank}${preferredText}
                        </div>
                    `;
                }
                
                const amount = typeof settlement.amount === 'number' 
                    ? settlement.amount.toFixed(2) 
                    : parseFloat(settlement.amount).toFixed(2);
                
                settlementsSection += `
                    <div style="background-color: #f8f9fa; padding: 12px 15px; margin-bottom: 8px; border-radius: 5px; border-left: 3px solid ${isV4 ? '#9b59b6' : '#3498db'}; page-break-inside: avoid;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600;">
                                <span style="color: ${isV4 ? '#9b59b6' : '#2c3e50'};">${settlement.from}</span>
                                <span style="color: #7f8c8d;">→</span>
                                <span style="color: ${isV4 ? '#9b59b6' : '#2c3e50'};">${settlement.to}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: bold; color: #2c3e50; background-color: #e8f4fc; padding: 4px 8px; border-radius: 3px; border: 1px solid #3498db; font-size: 12px;">
                                    ${amount} SAR
                                </span>
                                <span style="font-weight: 600; padding: 4px 8px; border-radius: 3px; font-size: 11px; color: ${statusColor}; background-color: ${statusBg}; border: 1px solid ${statusColor};">
                                    ${statusText}
                                </span>
                            </div>
                        </div>
                        ${bankMatchHtml}
                    </div>
                `;
            });
        }
        
        settlementsSection += `</div>`;
        
        // Footer
        const footer = `
            <div style="text-align: center; margin-top: 25px; padding-top: 12px; border-top: 1px solid #eaeaea; color: #7f8c8d; font-size: 8px;">
                <p>Generated with HisaabKitaabApp ${version} (created by Mudassar) • ${new Date().toLocaleString()}</p>
                ${isV4 ? '<p style="font-size: 8px; margin-top: 2px;">Equal Split • Each person pays only ONE person</p>' : ''}
            </div>
        `;
        
        // Combine all sections
        pdfContainer.innerHTML = header + summarySection + sharesSection + settlementsSection + footer;
        
        // Add to document for rendering
        document.body.appendChild(pdfContainer);
        
        return pdfContainer;
    }
})();