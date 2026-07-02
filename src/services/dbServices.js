import { supabase } from '../config/supabaseClient';
import { encryptMessage, decryptMessage } from '../utils/encryption';

export const sendMessage = async (channel, pseudo, content, isSystem = false, replyToId = null, userId = null) => {
  // Encrypt the message content
  const encryptedContent = encryptMessage(content, channel);
  
  const insertData = { channel_name: channel, user_pseudo: pseudo, content: encryptedContent, is_system_msg: isSystem };
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
  
  // Decrypt messages
  const decryptedData = data.map(msg => ({
    ...msg,
    content: decryptMessage(msg.content, channel)
  }));
  
  return decryptedData.reverse();
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

export const addFriendWithPin = async (senderPin, targetPin) => {
  if (!senderPin) {
    return { success: false, message: "Kamu harus registrasi akun terlebih dahulu untuk menambah teman." };
  }

  // Get sender's true user_id
  const { data: senderData, error: senderError } = await supabase
    .from('registered_users')
    .select('user_id')
    .eq('pin_code', senderPin)
    .maybeSingle();

  if (senderError || !senderData) {
    return { success: false, message: "Profil pengirim tidak ditemukan di database." };
  }
  const trueUserId = senderData.user_id;

  let targetUserId = null;
  let isTempPin = false;

  // Check permanent pin for target
  const { data: permData, error: permError } = await supabase
    .from('registered_users')
    .select('user_id')
    .eq('pin_code', targetPin)
    .maybeSingle();

  if (!permError && permData && permData.user_id) {
    targetUserId = permData.user_id;
  } else {
    // Find the temp pin
    const { data: pinData, error: pinError } = await supabase
      .from('temp_pins')
      .select('*')
      .eq('pin_code', targetPin)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (pinError || !pinData) {
      console.error("Invalid or expired PIN", pinError);
      return { success: false, message: "PIN tidak valid atau sudah kadaluarsa" };
    }
    targetUserId = pinData.user_id;
    isTempPin = true;
  }

  if (targetUserId === trueUserId) {
    return { success: false, message: "Kamu tidak bisa menambahkan dirimu sendiri" };
  }

  // Check if they are already friends or have a pending request
  const { data: existingLink } = await supabase
    .from('friend_links')
    .select('status')
    .or(`and(user_a_id.eq.${trueUserId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${trueUserId})`)
    .maybeSingle();

  if (existingLink) {
    if (existingLink.status === 'accepted') {
      return { success: false, message: "Kalian sudah berteman." };
    }
    return { success: false, message: "Permintaan pertemanan sudah pernah dikirim." };
  }

  // Create friend link
  const { error: linkError } = await supabase
    .from('friend_links')
    .insert([
      { user_a_id: trueUserId, user_b_id: targetUserId, status: 'pending' }
    ]);

  if (linkError) {
    console.error("Error creating friend link", linkError);
    return { success: false, message: "Gagal mengirim permintaan pertemanan" };
  }

  if (isTempPin) {
    // Fallback: Notify App.jsx to broadcast the event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('send_friend_request_broadcast', {
        detail: { targetUserId: targetUserId }
      }));
    }

    // Optionally delete the temp pin so it can't be reused
    await supabase.from('temp_pins').delete().eq('pin_code', targetPin);
  }

  return { success: true, message: "Permintaan pertemanan berhasil dikirim" };
};

export const fetchFriends = async (userId) => {
  // A friend link can have the user in user_a_id or user_b_id
  const { data, error } = await supabase
    .from('friend_links')
    .select('*')
    .eq('status', 'accepted')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  if (error) {
    console.error("Error fetching friends:", error);
    return [];
  }

  // Extract the friend IDs
  const friendIds = data.map(link => link.user_a_id === userId ? link.user_b_id : link.user_a_id);
  return friendIds;
};

export const fetchFriendNicks = async (userId) => {
  if (!userId) return [];
  
  // A friend link can have the user in user_a_id or user_b_id
  const { data, error } = await supabase
    .from('friend_links')
    .select('user_a_id, user_b_id')
    .eq('status', 'accepted')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  if (error || !data) {
    console.error("Error fetching friend links:", error);
    return [];
  }

  const friendIds = data.map(link => link.user_a_id === userId ? link.user_b_id : link.user_a_id);
  if (friendIds.length === 0) return [];
  
  const { data: usersData, error: usersError } = await supabase
    .from('registered_users')
    .select('nickname')
    .in('user_id', friendIds);
    
  if (usersError || !usersData) {
    console.error("Error fetching friend nicks:", usersError);
    return [];
  }
  
  return usersData.map(u => u.nickname);
};

export const checkIsFriend = async (myUserId, targetUserId) => {
  if (!myUserId || !targetUserId) return false;
  const { data, error } = await supabase
    .from('friend_links')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(user_a_id.eq.${myUserId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${myUserId})`)
    .maybeSingle();
    
  if (error) {
    console.error("Error checking friend status:", error);
    return false;
  }
  return !!data;
};

export const fetchPendingRequests = async (userId) => {
  const { data, error } = await supabase
    .from('friend_links')
    .select('id, user_a_id, created_at')
    .eq('user_b_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (error || !data || data.length === 0) return [];
  
  const senderIds = data.map(link => link.user_a_id);
  const { data: usersData } = await supabase
    .from('registered_users')
    .select('user_id, nickname')
    .in('user_id', senderIds);
    
  return data.map(link => {
    const sender = usersData?.find(u => u.user_id === link.user_a_id);
    if (!sender) return null; // Ignore if sender is not registered
    return {
      id: link.id,
      sender_id: link.user_a_id,
      sender_nickname: sender.nickname,
      created_at: link.created_at
    };
  }).filter(Boolean);
};

export const acceptFriendRequest = async (linkId) => {
  const { error } = await supabase
    .from('friend_links')
    .update({ status: 'accepted' })
    .eq('id', linkId);
  return !error;
};

export const rejectFriendRequest = async (linkId) => {
  const { error } = await supabase
    .from('friend_links')
    .delete()
    .eq('id', linkId);
  return !error;
};

export const removeFriend = async (myUserId, targetNick) => {
  if (!myUserId || !targetNick) return false;
  
  // First, find the target user's ID
  const { data: targetData, error: targetError } = await supabase
    .from('registered_users')
    .select('user_id')
    .ilike('nickname', targetNick)
    .maybeSingle();
    
  if (targetError || !targetData || !targetData.user_id) return false;
  const targetUserId = targetData.user_id;
  
  const { error } = await supabase
    .from('friend_links')
    .delete()
    .or(`and(user_a_id.eq.${myUserId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${myUserId})`);
    
  return !error;
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

// --- Vibes Functions ---

export const uploadVibe = async (nickname, content, bgColor) => {
  if (!nickname || !content) return false;

  const { data: userData, error: userError } = await supabase
    .from('registered_users')
    .select('user_id')
    .ilike('nickname', nickname)
    .maybeSingle();

  if (userError || !userData || !userData.user_id) {
    console.error("Error finding user for vibe upload:", userError);
    return false;
  }

  const { error } = await supabase
    .from('vibes')
    .insert([{ 
      user_id: userData.user_id, 
      content, 
      bg_color: bgColor || 'bg-gradient-to-br from-primary to-accent' 
    }]);
  
  if (error) {
    console.error("Error uploading vibe:", error);
    return false;
  }
  return true;
};

export const fetchActiveVibes = async () => {
  const { data, error } = await supabase
    .from('vibes')
    .select(`
      id,
      content,
      bg_color,
      created_at,
      expires_at,
      user_id,
      registered_users!inner(nickname, vibes_visibility),
      vibe_views(viewer_nickname, viewed_at)
    `)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error("Error fetching vibes:", error);
    return [];
  }
  
  // Group by user
  const vibesByUser = {};
  data.forEach(vibe => {
    const nick = vibe.registered_users.nickname;
    if (!vibesByUser[nick]) {
      vibesByUser[nick] = {
        nickname: nick,
        user_id: vibe.user_id,
        vibes_visibility: vibe.registered_users.vibes_visibility || 'friends_only',
        vibes: []
      };
    }
    vibesByUser[nick].vibes.push({
      id: vibe.id,
      content: vibe.content,
      bg_color: vibe.bg_color,
      created_at: vibe.created_at,
      expires_at: vibe.expires_at,
      views: vibe.vibe_views || []
    });
  });

  return Object.values(vibesByUser);
};

export const recordVibeView = async (vibeId, viewerNickname) => {
  if (!vibeId || !viewerNickname) return;
  // Use upsert to ignore duplicates (since there is a unique constraint)
  const { error } = await supabase
    .from('vibe_views')
    .upsert(
      { vibe_id: vibeId, viewer_nickname: viewerNickname },
      { onConflict: 'vibe_id,viewer_nickname', ignoreDuplicates: true }
    );
    
  if (error) console.error("Error recording vibe view:", error);
};

export const fetchVibesVisibility = async (nickname) => {
  if (!nickname) return 'friends_only';
  const { data, error } = await supabase
    .from('registered_users')
    .select('vibes_visibility')
    .ilike('nickname', nickname)
    .maybeSingle();
    
  if (error || !data) return 'friends_only';
  return data.vibes_visibility || 'friends_only';
};

export const updateVibesVisibility = async (nickname, visibility) => {
  if (!nickname || !visibility) return false;
  const { error } = await supabase
    .from('registered_users')
    .update({ vibes_visibility: visibility })
    .ilike('nickname', nickname);
    
  return !error;
};

export const fetchUserProfile = async (nickname) => {
  if (!nickname) return null;
  const { data, error } = await supabase
    .from('registered_users')
    .select('user_id, nickname, avatar_url, bio, gender, created_at')
    .ilike('nickname', nickname)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Error fetching profile:", error);
    return null;
  }
  
  let connectionCount = 0;
  if (data.user_id) {
    const { count } = await supabase
      .from('friend_links')
      .select('*', { count: 'exact', head: true })
      .or(`user_a_id.eq.${data.user_id},user_b_id.eq.${data.user_id}`);
    connectionCount = count || 0;
  }

  return { ...data, connectionCount };
};

export const updateUserProfile = async (nickname, profileData) => {
  if (!nickname) return false;
  
  const { error } = await supabase
    .from('registered_users')
    .update({
      avatar_url: profileData.avatar_url,
      bio: profileData.bio,
      gender: profileData.gender
    })
    .ilike('nickname', nickname);
    
  if (error) {
    console.error("Error updating profile:", error);
    return false;
  }
  return true;
};

export const uploadFileToR2 = async (file, isVibe = false) => {
  try {
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const functionName = isVibe ? 'generate-vibe-url' : 'generate-r2-url';
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { filename: safeFilename, contentType: file.type }
    });
    
    if (error) throw error;
    
    let { signedUrl, publicUrl } = data;
    
    // Ensure publicUrl has https:// if user forgot it in their edge function env var
    if (publicUrl) {
      if (!publicUrl.startsWith('http')) {
        publicUrl = 'https://' + publicUrl.replace(/^:\/\//, '');
      }
      // Force custom domain replacing the default r2.dev domain
      publicUrl = publicUrl.replace('pub-f591f14e39f84bdc80676d77036d98b2.r2.dev', 'media.anorachat.com');
    }
    
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (uploadResponse.ok) {
      return publicUrl;
    } else {
      throw new Error("Failed to upload to R2");
    }
  } catch (err) {
    console.error("R2 Upload Error:", err);
    throw err;
  }
};

export const deleteVibe = async (vibeId, pin) => {
  try {
    if (!pin) {
      console.error("Missing PIN for deletion.");
      return false;
    }

    const { data, error } = await supabase
      .rpc('delete_vibe_with_pin', {
        p_vibe_id: vibeId,
        p_pin: pin
      });
      
    if (error || data !== true) {
      console.error("Error deleting vibe via RPC:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception deleting vibe:", error);
    return false;
  }
};
