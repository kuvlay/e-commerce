import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEnvelope, FaEnvelopeOpen, FaReply, FaTimes, FaEye, FaTrash } from 'react-icons/fa';
import { backendUrl } from '../../../App';

const Messages = ({ token }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/contact/messages`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setMessages(response.data.messages);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/contact/stats`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  // Update message status
  const updateMessageStatus = async (messageId, status, adminNotes = '') => {
    try {
      const response = await axios.post(`${backendUrl}/api/contact/update-status`, {
        messageId,
        status,
        adminNotes
      }, {
        headers: { token }
      });
      
      if (response.data.success) {
        toast.success('Message updated successfully');
        fetchMessages();
        fetchStats();
        setSelectedMessage(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await axios.post(`${backendUrl}/api/contact/delete`, {
        messageId
      }, {
        headers: { token }
      });
      
      if (response.data.success) {
        toast.success('Message deleted successfully');
        fetchMessages();
        fetchStats();
        setSelectedMessage(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, []);

  // Filter messages
  const filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    return message.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <FaEnvelope className="text-blue-600" />;
      case 'read': return <FaEnvelopeOpen className="text-yellow-600" />;
      case 'replied': return <FaReply className="text-green-600" />;
      case 'closed': return <FaTimes className="text-gray-600" />;
      default: return <FaEnvelope className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600 mt-1">Manage customer inquiries and support requests</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-100 px-4 py-2 rounded-lg">
            <span className="text-blue-800 font-semibold">New: {stats.new || 0}</span>
          </div>
          <div className="bg-yellow-100 px-4 py-2 rounded-lg">
            <span className="text-yellow-800 font-semibold">Pending: {(stats.new || 0) + (stats.read || 0)}</span>
          </div>
          <div className="bg-green-100 px-4 py-2 rounded-lg">
            <span className="text-green-800 font-semibold">Total: {stats.total || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'new', 'read', 'replied', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === status
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status} {status !== 'all' && `(${stats[status] || 0})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaEnvelope className="mx-auto text-4xl mb-4" />
                <p>No messages found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <div
                    key={message._id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedMessage?._id === message._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(message.status)}
                          <h3 className="font-semibold text-gray-900">{message.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {message.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{message.email}</p>
                        <p className="font-medium text-gray-900 mb-2">{message.subject}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(message.createdAt).toLocaleDateString()} at{' '}
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Details */}
        <div className="lg:col-span-1">
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">From</label>
                  <p className="text-gray-900">{selectedMessage.name}</p>
                  <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-gray-900">{selectedMessage.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Received</label>
                  <p className="text-gray-900">
                    {new Date(selectedMessage.createdAt).toLocaleDateString()} at{' '}
                    {new Date(selectedMessage.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {selectedMessage.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                {selectedMessage.status === 'new' && (
                  <button
                    onClick={() => updateMessageStatus(selectedMessage._id, 'read')}
                    className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaEye /> Mark as Read
                  </button>
                )}
                
                {(selectedMessage.status === 'read' || selectedMessage.status === 'new') && (
                  <button
                    onClick={() => updateMessageStatus(selectedMessage._id, 'replied')}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaReply /> Mark as Replied
                  </button>
                )}

                {/* Quick Reply Button */}
                <button
                  onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}&body=Dear ${selectedMessage.name},%0D%0A%0D%0AThank you for contacting us.%0D%0A%0D%0ABest regards,%0D%0ASupport Team`)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
                >
                  📧 Quick Reply via Email
                </button>
                
                <button
                  onClick={() => updateMessageStatus(selectedMessage._id, 'closed')}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <FaTimes /> Close Message
                </button>
                
                <button
                  onClick={() => deleteMessage(selectedMessage._id)}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <FaTrash /> Delete Message
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <FaEnvelope className="mx-auto text-4xl mb-4" />
              <p>Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;