import { supabase } from '../config/supabaseClient';

export const sendMessage = async (channel, pseudo, content, isSystem = false) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { channel_name: channel, user_pseudo: pseudo, content, is_system_msg: isSystem }
    ]);
    
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
  // Find the pin
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

  return { success: true, message: "Friend added to Radar successfully" };
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
