// src/api/graphql.js
// Quản lý API Client và tập hợp toàn bộ GraphQL Queries / Mutations / Subscriptions của hệ thống

import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '../config';

export const client = generateClient();

// Hàm thực thi GraphQL request với JWT Bearer Token lấy từ Cognito User Pool
export async function executeGraphQL(query, variables = {}) {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
        throw new Error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(awsConfig.API.GraphQL.endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token,
        },
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(result.errors[0]?.message || "Lỗi xử lý GraphQL");
    }
    return result.data;
}

// 1. Quản lý Nhóm
export const GET_MY_GROUPS_QUERY = `
    query GetMyGroups {
        getMyGroups {
            groupId
            name
            ownerId
            createdAt
        }
    }
`;

export const CREATE_GROUP_MUTATION = `
    mutation CreateGroup($name: String!) {
        createGroup(name: $name) {
            groupId
            name
            ownerId
            createdAt
        }
    }
`;

export const JOIN_GROUP_MUTATION = `
    mutation JoinGroup($groupId: ID!) {
        joinGroup(groupId: $groupId) {
            groupId
            name
            ownerId
            createdAt
        }
    }
`;

export const DELETE_GROUP_MUTATION = `
    mutation DeleteGroup($groupId: ID!) {
        deleteGroup(groupId: $groupId)
    }
`;

export const LEAVE_GROUP_MUTATION = `
    mutation LeaveGroup($groupId: ID!) {
        leaveGroup(groupId: $groupId)
    }
`;

// 2. Quản lý Thành viên & Lịch rảnh
export const GET_USERS_FROM_GROUP_QUERY = `
    query GetUsersFromGroup($groupId: ID!) {
        getUsersFromGroup(groupId: $groupId) {
            groupId
            userId
            userName
            timeSlots {
                startTime
                endTime
            }
        }
    }
`;

export const SET_AVAILABILITY_MUTATION = `
    mutation SetAvail($groupId: ID!, $userId: ID!, $userName: String, $timeSlots: [TimeSlotInput!]!) {
        setAvailability(groupId: $groupId, userId: $userId, userName: $userName, timeSlots: $timeSlots) {
            groupId
            userId
            userName
            timeSlots {
                startTime
                endTime
            }
        }
    }
`;

export const CALCULATE_OVERLAP_QUERY = `
    query CalculateOverlap($groupId: ID!) {
        calculateOverlap(groupId: $groupId) {
            groupId
            overlappingSlots {
                startTime
                endTime
            }
        }
    }
`;

// 3. Quản lý Tin nhắn thời gian thực (Chat Box)
export const GET_GROUP_MESSAGES_QUERY = `
    query GetGroupMessages($groupId: ID!, $limit: Int) {
        getGroupMessages(groupId: $groupId, limit: $limit) {
            messageId
            groupId
            senderId
            senderName
            content
            createdAt
        }
    }
`;

export const SEND_MESSAGE_MUTATION = `
    mutation SendMessage($groupId: ID!, $content: String!) {
        sendMessage(groupId: $groupId, content: $content) {
            messageId
            groupId
            senderId
            senderName
            content
            createdAt
        }
    }
`;

export const ON_NEW_MESSAGE_SUBSCRIPTION = `
    subscription OnNewMessage($groupId: ID!) {
        onNewMessage(groupId: $groupId) {
            messageId
            groupId
            senderId
            senderName
            content
            createdAt
        }
    }
`;

export const ON_AVAILABILITY_UPDATED_SUBSCRIPTION = `
    subscription OnAvailabilityUpdated($groupId: ID!) {
        onAvailabilityUpdated(groupId: $groupId) {
            groupId
            userId
            userName
            timeSlots {
                startTime
                endTime
            }
        }
    }
`;
