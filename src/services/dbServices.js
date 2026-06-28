import { supabase } from '../config/supabaseClient';

export const sendMessage = async (channel, pseudo, content, isSystem = false, replyToId = null, userId = null) => {
  const insertData = { channel_name: channel, user_pseudo: pseudo, content, is_system_msg: isSystem };
  if (userId) insertData.user_id = userId;
  if (replyToId) insertData.reply_to_id = replyToId;

  const { data, error } = await supabase
    .from('messages')
    .insert([insertData]);
    
  if (error) {
    console.error("Error sending message:", error);
    return null;
  }
  return data;
};

export const fetchMessages = async (channel, limit = 50) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_name', channel)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data.reverse();
};

export const fetchUnreadCountsForUser = async (channels, pseudo) => {
  const counts = {};
  if (!channels || channels.length === 0) return counts;

  const { data, error } = await supabase
    .from('messages')
    .select('channel_name, created_at')
    .in('channel_name', channels)
    .neq('user_pseudo', pseudo);

  if (error) {
    console.error("Error fetching unread counts:", error);
    return counts;
  }

  data.forEach(msg => {
    const channel = msg.channel_name;
    const lastRead = parseInt(localStorage.getItem(`last_read_${pseudo}_${channel}`) || '0', 10);
    const msgTime = new Date(msg.created_at).getTime();

    if (msgTime > lastRead) {
      counts[channel] = (counts[channel] || 0) + 1;
    }
  });

  return counts;
};

export const generatePin = async (userId) => {
  const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN
  const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes from now

  const { data, error } = await supabase
    .from('temp_pins')
    .insert([{ pin_code: pin, user_id: userId, expires_at: expiresAt.toISOString() }])
    .select()
    .single();

  if (error) {
    console.error("Error generating PIN:", error);
    return null;
  }
  return data.pin_code;
};

export const addFriendWithPin = async (userId, pin) => {
  // Check permanent pin first
  const { data: permData, error: permError } = await supabase
    .from('registered_users')
    .select('user_id')
    .eq('pin_code', pin)
    .maybeSingle();

  if (!permError && permData && permData.user_id) {
    if (permData.user_id === userId) {
      return { success: false, message: "You cannot add yourself" };
    }
    
    // Create friend link
    const { error: linkError } = await supabase
      .from('friend_links')
      .insert([
        { user_a_id: userId, user_b_id: permData.user_id }
      ]);

    if (linkError) {
      console.error("Error creating friend link", linkError);
      return { success: false, message: "Error creating friend link or already friends" };
    }

    return { success: true, message: "Connection added successfully via Permanent PIN" };
  }

  // Find the temp pin
  const { data: pinData, error: pinError } = await supabase
    .from('temp_pins')
    .select('*')
    .eq('pin_code', pin)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (pinError || !pinData) {
    console.error("Invalid or expired PIN", pinError);
    return { success: false, message: "Invalid or expired PIN" };
  }

  if (pinData.user_id === userId) {
    return { success: false, message: "You cannot add yourself" };
  }

  // Create friend link
  const { error: linkError } = await supabase
    .from('friend_links')
    .insert([
      { user_a_id: userId, user_b_id: pinData.user_id }
    ]);

  if (linkError) {
    console.error("Error creating friend link", linkError);
    return { success: false, message: "Error creating friend link" };
  }

  // Optionally delete the pin so it can't be reused
  await supabase.from('temp_pins').delete().eq('pin_code', pin);

  return { success: true, message: "Connection added successfully" };
};

export const fetchFriends = async (userId) => {
  // A friend link can have the user in user_a_id or user_b_id
  const { data, error } = await supabase
    .from('friend_links')
    .select('*')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  if (error) {
    console.error("Error fetching friends:", error);
    return [];
  }

  // Extract the friend IDs
  const friendIds = data.map(link => link.user_a_id === userId ? link.user_b_id : link.user_a_id);
  return friendIds;
};

export const checkIsFriend = async (myUserId, targetUserId) => {
  if (!myUserId || !targetUserId) return false;
  const { data, error } = await supabase
    .from('friend_links')
    .select('id')
    .or(`and(user_a_id.eq.${myUserId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${myUserId})`)
    .maybeSingle();
    
  if (error) {
    console.error("Error checking friend status:", error);
    return false;
  }
  return !!data;
};

// --- New logic for Registration ---

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const checkNicknameExists = async (nickname) => {
  const { data, error } = await supabase
    .from('registered_users')
    .select('nickname')
    .ilike('nickname', nickname)
    .maybeSingle();
    
  if (error) console.error("Error checking nickname:", error);
  return !!data;
};

export const checkEmailExists = async (email) => {
  const { data, error } = await supabase
    .from('registered_users')
    .select('email')
    .ilike('email', email)
    .maybeSingle();
    
  if (error) console.error("Error checking email:", error);
  return !!data;
};

export const registerNickname = async (nickname, password, email, userId) => {
  const passwordHash = await hashPassword(password);
  
  // Generate permanent PIN (6 chars, lowercase alphanumeric)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let pinCode = '';
  for (let i = 0; i < 6; i++) {
    pinCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const { data, error } = await supabase
    .from('registered_users')
    .insert([
      { nickname, email, password_hash: passwordHash, user_id: userId, pin_code: pinCode }
    ])
    .select('pin_code')
    .maybeSingle();
    
  if (error || !data) {
    console.error("Error registering nickname:", error);
    return null;
  }
  return data.pin_code;
};

export const verifyNickname = async (nickname, password, currentUserId) => {
  const passwordHash = await hashPassword(password);
  const { data, error } = await supabase
    .from('registered_users')
    .select('password_hash, user_id')
    .ilike('nickname', nickname)
    .maybeSingle();
    
  if (error || !data) return false;
  
  if (data.password_hash === passwordHash) {
    // If successful and currentUserId is provided, update user_id and migrate friends
    if (currentUserId && data.user_id !== currentUserId) {
      const oldUserId = data.user_id;
      
      // Update registered_users
      await supabase
        .from('registered_users')
        .update({ user_id: currentUserId })
        .ilike('nickname', nickname);
        
      // Migrate friend_links (don't wait for these, let them run in background)
      if (oldUserId) {
         supabase.from('friend_links').update({ user_a_id: currentUserId }).eq('user_a_id', oldUserId).then();
         supabase.from('friend_links').update({ user_b_id: currentUserId }).eq('user_b_id', oldUserId).then();
      }
    }
    return true;
  }
  return false;
};

export const fetchUserPin = async (nickname) => {
  if (!nickname) return null;
  const { data, error } = await supabase
    .from('registered_users')
    .select('pin_code')
    .ilike('nickname', nickname)
    .maybeSingle();
  if (error || !data) return null;
  return data.pin_code;
};

export const fetchFollowedChannels = async (nickname) => {
  if (!nickname) return [];
  const { data, error } = await supabase
    .from('registered_users')
    .select('followed_channels')
    .ilike('nickname', nickname)
    .maybeSingle();
  
  if (error || !data) return [];
  return data.followed_channels || [];
};

export const toggleFollowChannel = async (nickname, channel, isFollowing) => {
  if (!nickname || !channel) return false;
  
  // First fetch current followed channels
  const currentChannels = await fetchFollowedChannels(nickname);
  
  let newChannels;
  if (isFollowing) {
    if (currentChannels.includes(channel)) return true; // Already following
    newChannels = [...currentChannels, channel];
  } else {
    newChannels = currentChannels.filter(c => c !== channel);
  }
  
  const { error } = await supabase
    .from('registered_users')
    .update({ followed_channels: newChannels })
    .ilike('nickname', nickname);
    
  if (error) {
    console.error("Error toggling follow channel:", error);
    return false;
  }
  return true;
};

export const markMessagesAsRead = async (channel, userPseudo) => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('channel_name', channel)
    .neq('user_pseudo', userPseudo)
    .eq('is_read', false);
    
  if (error) {
    console.error("Error marking messages as read:", error);
  }
};

export const addReaction = async (messageId, emoji, userPseudo) => {
  const { data, error } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single();

  if (error || !data) return;

  const currentReactions = data.reactions || {};
  
  if (!currentReactions[emoji]) {
    currentReactions[emoji] = [];
  }

  if (currentReactions[emoji].includes(userPseudo)) {
    currentReactions[emoji] = currentReactions[emoji].filter(p => p !== userPseudo);
    if (currentReactions[emoji].length === 0) {
      delete currentReactions[emoji];
    }
  } else {
    currentReactions[emoji].push(userPseudo);
  }

  const { error: updateError } = await supabase
    .from('messages')
    .update({ reactions: currentReactions })
    .eq('id', messageId);
    
  if (updateError) console.error("Error updating reaction:", updateError);
};
