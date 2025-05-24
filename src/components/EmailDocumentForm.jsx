import { useState, useEffect } from 'react';

/**
 * Component for sending documents via email
 */
export default function EmailDocumentForm({ 
  documentType = 'excel', 
  userId,
  onSuccess = () => {},
  onError = () => {},
  className = '',
  generatedContent = null, // For pre-generated document content (CSV data, etc.)
  defaultFileName = '', // Default filename for the generated content
  sheetName = null, // Sheet name if available
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    document: null,
  });
  const [useGeneratedContent, setUseGeneratedContent] = useState(!!generatedContent);
  const [sendFormat, setSendFormat] = useState('csv');

  // Update when generatedContent changes
  useEffect(() => {
    if (generatedContent) {
      setUseGeneratedContent(true);
    }
  }, [generatedContent]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFormData(prev => ({
      ...prev,
      document: file
    }));
    
    // If a file is selected manually, don't use the generated content
    setUseGeneratedContent(false);
  };

  // Toggle between generated content and manual file upload
  const toggleUseGeneratedContent = () => {
    setUseGeneratedContent(prev => !prev);
    
    // Reset the document field if switching to generated content
    if (!useGeneratedContent) {
      setFormData(prev => ({
        ...prev,
        document: null
      }));
      
      // Reset file input
      const fileInput = document.getElementById('document-file');
      if (fileInput) fileInput.value = '';
    }
  };

  // Handle format change
  const handleFormatChange = (e) => {
    setSendFormat(e.target.value);
  };

  // Send the document via email
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Validate form data
      if (!formData.to || !formData.subject) {
        throw new Error('Please fill all required fields');
      }

      // Handle different sending methods based on selected options
      if (sendFormat) {
        const response = await fetch('/api/email/sendGoogleSheet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: formData.to,
            subject: formData.subject,
            message: formData.message,
            sheetName: sheetName,
            format: sendFormat === "pdf" ? 'pdf' : 'excel',
            userId,
            senderInfo: `User ID: ${userId || 'Unknown'}, Browser: ${navigator.userAgent}`
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send email');
        }
      } else {
        // Default behavior: send CSV or uploaded file
        if (!useGeneratedContent && !formData.document) {
          throw new Error('Please attach a document');
        }
        
        let documentContent;
        let documentName;
        
        if (useGeneratedContent && generatedContent) {
          // Use the pre-generated content
          documentContent = generatedContent;
          documentName = defaultFileName || `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          // Read uploaded file as base64
          if (!formData.document) {
            throw new Error('Please attach a document');
          }
          
          const fileReader = new FileReader();
          
          const readFilePromise = new Promise((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = () => reject(new Error('Failed to read file'));
          });
          
          fileReader.readAsDataURL(formData.document);
          documentContent = await readFilePromise;
          documentName = formData.document.name;
        }
        
        // Send API request
        const response = await fetch('/api/email/sendDocument', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: formData.to,
            subject: formData.subject,
            message: formData.message,
            documentContent,
            documentName,
            documentType,
            userId,
            senderInfo: `User ID: ${userId || 'Unknown'}, Browser: ${navigator.userAgent}`
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send email');
        }
      }
      
      // Success
      setSuccess(true);
      setFormData({
        to: '',
        subject: '',
        message: '',
        document: null,
      });
      
      // Reset file input
      const fileInput = document.getElementById('document-file');
      if (fileInput) fileInput.value = '';
      
      onSuccess();
    } catch (err) {
      console.error('Error sending document:', err);
      setError(err.message || 'Failed to send document');
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`email-document-form ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Send Document via Email</h2>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Document sent successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="to" className="block text-sm font-medium">
            Recipient Email *
          </label>
          <input
            type="email"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
          <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
            <label className="block text-sm font-medium mb-2">
              Document Format
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="format-csv"
                  name="format"
                  value="csv"
                  checked={sendFormat === 'csv'}
                  onChange={handleFormatChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="format-csv" className="ml-2 block text-sm text-gray-900">
                  Send current view as CSV (filtered data only)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="format-original"
                  name="format"
                  value="original"
                  checked={sendFormat === 'original'}
                  onChange={handleFormatChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="format-original" className="ml-2 block text-sm text-gray-900">
                  Send original Google Sheet as Excel (complete data)
                </label>
              </div>
            </div>
          </div>
        
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-red-600">
            * Required fields
          </p>
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Document'}
          </button>
        </div>
      </form>
    </div>
  );
}
