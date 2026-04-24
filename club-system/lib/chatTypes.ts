export type MsgType = 'text' | 'image' | 'video' | 'audio';
export type ConvType = 'direct' | 'group';

export interface ChatMsg {
  id: string;
  senderId: string;
  content: string;
  type: MsgType;
  ts: string;
  readBy: string[];
}

export interface ChatConv {
  id: string;
  convType: ConvType;
  participantIds: string[];
  msgs: ChatMsg[];
  name?: string;
  adminIds?: string[];
  restricted?: boolean;
  teamId?: string;
  isLeadershipGroup?: boolean;
}
