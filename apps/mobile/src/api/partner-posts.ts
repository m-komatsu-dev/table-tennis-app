import { apiRequest } from "@/api/client";
import type { PartnerPost, PartnerPostStatus, PartnerPostType, PartnerRequest, PartnerRequestStatus } from "@/types";

export type PartnerPostInput = {
  type: PartnerPostType;
  title: string;
  area?: string;
  preferredTime?: string;
  level?: string;
  purpose?: string;
  message?: string;
  status?: PartnerPostStatus;
};

export type PartnerPostListParams = {
  type?: PartnerPostType;
  status?: PartnerPostStatus;
  mine?: boolean;
};

export async function fetchPartnerPosts(params: PartnerPostListParams = {}) {
  const search = new URLSearchParams();

  if (params.type) {
    search.set("type", params.type);
  }

  if (params.status) {
    search.set("status", params.status);
  }

  if (params.mine) {
    search.set("mine", "1");
  }

  const query = search.toString();

  return apiRequest<{ partnerPosts: PartnerPost[] }>(`/api/mobile/partner-posts${query ? `?${query}` : ""}`);
}

export async function fetchPartnerPost(id: string) {
  return apiRequest<{ partnerPost: PartnerPost }>(`/api/mobile/partner-posts/${id}`);
}

export async function createPartnerPost(input: PartnerPostInput) {
  return apiRequest<{ partnerPost: PartnerPost }>("/api/mobile/partner-posts", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updatePartnerPost(id: string, input: PartnerPostInput) {
  return apiRequest<{ partnerPost: PartnerPost }>(`/api/mobile/partner-posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deletePartnerPost(id: string) {
  return apiRequest<{ ok: true }>(`/api/mobile/partner-posts/${id}`, {
    method: "DELETE"
  });
}

export async function createPartnerRequest(postId: string, message: string) {
  return apiRequest<{ partnerRequest: PartnerRequest }>(`/api/mobile/partner-posts/${postId}/requests`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export async function fetchPartnerRequests(postId: string) {
  return apiRequest<{ partnerRequests: PartnerRequest[] }>(`/api/mobile/partner-posts/${postId}/requests`);
}

export async function updatePartnerRequest(id: string, status: PartnerRequestStatus) {
  return apiRequest<{ partnerRequest: PartnerRequest; chatRoomId: string | null }>(`/api/mobile/partner-requests/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}
