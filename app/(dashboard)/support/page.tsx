"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lifebuoy,
  PaperPlaneTilt,
  X,
  User,
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  ChatCircle,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
  user_id: string;
};

type Reply = {
  id: string;
  ticket_id: string;
  message: string;
  created_at: string;
  user_name: string;
  user_role: string;
  user_id: string;
};

function TicketsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded mb-3" />
          <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded mb-2" />
          <div className="h-3 w-1/4 bg-gray-100 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export default function SupportPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "normal",
  });
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "open" | "in_progress" | "resolved" | "closed"
  >("all");
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("support-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          console.log("🔄 Ticket updated");
          fetchTickets();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_replies",
        },
        (payload: any) => {
          console.log("💬 New reply");
          if (selectedTicket && payload.new?.ticket_id === selectedTicket.id) {
            fetchReplies(selectedTicket.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedTicket]);

  const checkAuthAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("dashboardUsers")
        .select("role, full_name, email")
        .eq("id", session.user.id)
        .single();

      setUserId(session.user.id);
      setUserRole(userData?.role || null);
      setUserName(userData?.full_name || "");
      setUserEmail(userData?.email || "");

      await fetchTickets();
      setLoading(false);
    } catch (err) {
      console.error("Auth error:", err);
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from("dashboardUsers")
        .select("role")
        .eq("id", session.user.id)
        .single();

      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      // Reporters only see their own tickets
      if (userData?.role === "reporter") {
        query = query.eq("user_id", session.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("ticket_replies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (err) {
      console.error("Error fetching replies:", err);
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert([
        {
          user_id: userId,
          subject: newTicket.subject,
          message: newTicket.message,
          priority: newTicket.priority,
          user_name: userName,
          user_email: userEmail,
          user_role: userRole,
        },
      ]);

      if (error) throw error;

      setNewTicket({ subject: "", message: "", priority: "normal" });
      setShowNewTicketModal(false);
      fetchTickets();
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("ticket_replies").insert([
        {
          ticket_id: selectedTicket.id,
          user_id: userId,
          message: replyMessage,
          user_name: userName,
          user_role: userRole,
        },
      ]);

      if (error) throw error;

      setReplyMessage("");
      fetchReplies(selectedTicket.id);
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    // ONLY admins and superadmins can update status
    if (userRole !== "admin" && userRole !== "superadmin") {
      return;
    }

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;

      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status } as Ticket);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
      in_progress: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: ChatCircle,
      },
      resolved: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: CheckCircle,
      },
      closed: { bg: "bg-gray-100", text: "text-gray-700", icon: XCircle },
    };
    const style = styles[status as keyof typeof styles];
    const Icon = style.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${style.bg} ${style.text}`}
      >
        <Icon className="h-3 w-3" weight="fill" />
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: "bg-gray-100 text-gray-600",
      normal: "bg-blue-100 text-blue-600",
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600",
    };
    const style = styles[priority as keyof typeof styles];

    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${style}`}
      >
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 animate-pulse rounded" />
        <TicketsSkeleton />
      </div>
    );
  }

  // Filter tickets
  const filteredTickets =
    filterStatus === "all"
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-xs text-gray-600 mt-1">
            {userRole === "reporter"
              ? "Create and track your support tickets"
              : "Manage all support requests"}
          </p>
        </div>

        {/* Only reporters can create tickets */}
        {userRole === "reporter" && (
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" weight="bold" />
            New Ticket
          </button>
        )}
      </div>

      {/* Stats & Filter */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-gray-200">
          <div className="p-3">
            <p className="text-xs text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600 mb-1">Open</p>
            <p className="text-2xl font-bold text-blue-600">
              {tickets.filter((t) => t.status === "open").length}
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">
              {tickets.filter((t) => t.status === "in_progress").length}
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-600">
              {tickets.filter((t) => t.status === "resolved").length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-t border-gray-200 p-2 flex gap-1">
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  filterStatus === status
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status.replace("_", " ").charAt(0).toUpperCase() +
                    status.replace("_", " ").slice(1)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Lifebuoy
              className="h-12 w-12 text-gray-300 mx-auto mb-3"
              weight="duotone"
            />
            <p className="text-sm text-gray-600">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  fetchReplies(ticket.id);
                }}
                className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 flex-1">
                    {ticket.subject}
                  </h3>
                  <div className="flex gap-2 ml-4">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                  {ticket.message}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{ticket.user_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900">New Ticket</h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  placeholder="Brief description"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, message: e.target.value })
                  }
                  placeholder="Describe your issue..."
                  rows={5}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTicket}
                disabled={submitting}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-gray-900 mb-1">
                    {selectedTicket.subject}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <User className="h-3 w-3" />
                    <span>{selectedTicket.user_name}</span>
                    <span>•</span>
                    <span>{selectedTicket.user_email}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedTicket.priority)}
                {getStatusBadge(selectedTicket.status)}
              </div>
            </div>

            {/* Status Actions - ONLY for Admin/SuperAdmin */}
            {(userRole === "admin" || userRole === "superadmin") && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">
                  Status:
                </span>
                {selectedTicket.status !== "in_progress" && (
                  <button
                    onClick={() =>
                      updateTicketStatus(selectedTicket.id, "in_progress")
                    }
                    className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                  >
                    In Progress
                  </button>
                )}
                {selectedTicket.status !== "resolved" && (
                  <button
                    onClick={() =>
                      updateTicketStatus(selectedTicket.id, "resolved")
                    }
                    className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Resolved
                  </button>
                )}
                {selectedTicket.status !== "closed" && (
                  <button
                    onClick={() =>
                      updateTicketStatus(selectedTicket.id, "closed")
                    }
                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            )}

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Original Message */}
              <div className="bg-blue-50 rounded-lg p-3 border-l-2 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-blue-700" weight="bold" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {selectedTicket.user_name}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Replies */}
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`rounded-lg p-3 border-l-2 ${
                    reply.user_role === "reporter"
                      ? "bg-blue-50 border-blue-500"
                      : "bg-green-50 border-green-500"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center ${
                        reply.user_role === "reporter"
                          ? "bg-blue-200"
                          : "bg-green-200"
                      }`}
                    >
                      <User
                        className={`h-3 w-3 ${
                          reply.user_role === "reporter"
                            ? "text-blue-700"
                            : "text-green-700"
                        }`}
                        weight="bold"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {reply.user_name}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {new Date(reply.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {reply.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Reply Section - Everyone can reply */}
            {selectedTicket.status !== "closed" && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={submitting || !replyMessage.trim()}
                    className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 h-fit"
                  >
                    <PaperPlaneTilt className="h-4 w-4" weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
