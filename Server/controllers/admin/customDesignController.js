const CustomDesign = require('../../src/schema/CustomDesignSchema');

exports.getAllPendingDesigns = async (req, res) => {
    try {
        const pendingDesigns = await CustomDesign.find({ status: 'Pending' }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: pendingDesigns });
    } catch (error) {
        console.error('Error fetching pending designs:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getAllCustomDesigns = async (req, res) => {
    try {
        const designs = await CustomDesign.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: designs });
    } catch (error) {
        console.error('Error fetching all designs:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getDesignById = async (req, res) => {
    try {
        const design = await CustomDesign.findById(req.params.id);
        if (!design) {
            return res.status(404).json({ success: false, message: 'Design not found' });
        }
        res.status(200).json({ success: true, data: design });
    } catch (error) {
        console.error('Error fetching design by ID:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.updateDesignStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        
        const design = await CustomDesign.findById(req.params.id);
        if (!design) {
            return res.status(404).json({ success: false, message: 'Design not found' });
        }

        // Update fields
        if (status) {
            design.status = status;
            
            // Calculate 4-day delivery date if Approved
            if (status === 'Approved') {
                const deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + 4);
                design.estimatedDeliveryDate = deliveryDate;
            }
        }
        
        if (adminNotes !== undefined) {
            design.adminNotes = adminNotes;
        }

        const updatedDesign = await design.save();

        res.status(200).json({ 
            success: true, 
            message: 'Design updated successfully', 
            data: updatedDesign 
        });
    } catch (error) {
        console.error('Error updating design status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Fetch quality control guidelines for design review
exports.getQualityControlGuidelines = (req, res) => {
    // Return production-standard guidelines
    const qualityControlGuidelines = {
        success: true,
        data: {
            standardRejectionReasons: [
                "Low Resolution (Under 300 DPI)",
                "Copyrighted Material / Intellectual Property Violation",
                "Inappropriate Content / Hate Speech",
                "Incorrect Aspect Ratio for Product",
                "Transparent Background Missing (If Required)",
                "Text is Too Small or Illegible"
            ],
            minimumPrintRequirements: {
                minDPI: 300,
                allowedFormats: ["PNG", "JPEG", "SVG", "PDF"],
                maxFileSizeMB: 50,
                colorProfile: "CMYK Recommended"
            }
        }
    };
    res.status(200).json(qualityControlGuidelines);
};
