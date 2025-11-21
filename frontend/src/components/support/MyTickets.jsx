import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useContext';
import { supportService } from '../../services/supportService';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { MessageSquare, Calendar, MapPin, CheckCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;

  useEffect(() => {
    if (user?.user_id) {
      fetchMyTickets();
    }
  }, [user?.user_id]);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const data = await supportService.getSupportByUserId(user.user_id);
      // Filter out closed tickets
      const filteredTickets = Array.isArray(data) 
        ? data.filter(ticket => ticket.status?.toLowerCase() !== 'closed') 
        : [];
      setTickets(filteredTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load your support tickets');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = tickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: 'Open', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
      closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700' },
    };
    return statusMap[status?.toLowerCase()] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      battery: 'Battery Issue',
      station_issue: 'Station Issue',
      other: 'Other',
    };
    return typeMap[type] || type;
  };

  const handleViewDetail = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            My Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No support tickets yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentTickets.map((ticket) => {
                const statusConfig = getStatusBadge(ticket.status);
                const hasResponse = ticket.admin_respond && ticket.admin_respond.trim() !== '';

                return (
                  <div
                    key={ticket.support_id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">
                            #{ticket.support_id}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getTypeBadge(ticket.type)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {ticket.description}
                        </p>

                        {ticket.station && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{ticket.station.name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(ticket.created_at)}</span>
                          </div>
                          
                          {hasResponse ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>You have a response from admin</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>No admin response yet</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(ticket)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Detail
                      </Button>
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Ticket Detail #{selectedTicket.support_id}</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Type */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {getTypeBadge(selectedTicket.type)}
                  </span>
                </div>

                {/* Station Info */}
                {selectedTicket.station && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Station</p>
                    <p className="font-medium">{selectedTicket.station.name}</p>
                    <p className="text-sm text-gray-600">{selectedTicket.station.address}</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Your Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {/* Admin Response */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Admin Response</p>
                  {selectedTicket.admin_respond && selectedTicket.admin_respond.trim() !== '' ? (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.admin_respond}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-gray-500 text-sm">
                      No admin response yet
                    </div>
                  )}
                </div>

                {/* Rating */}
                {selectedTicket.rating && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Rating</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < selectedTicket.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({selectedTicket.rating}/5)</span>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t pt-4 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {formatDate(selectedTicket.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Updated: {formatDate(selectedTicket.updated_at)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
