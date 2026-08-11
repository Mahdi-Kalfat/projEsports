export type ClanMemberUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
};

export type ClanMemberData = {
  id: string;
  role: string;
  user: ClanMemberUser;
};

export type ClanJoinRequestData = {
  id: string;
  user: ClanMemberUser;
};

export type ClanSummary = {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  visibility: string;
  minLevel: number;
  maxMembers: number;
  memberCount: number;
};
