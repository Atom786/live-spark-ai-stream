
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Users, MessageSquare, ThumbsUp, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Watch = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [channelExists, setChannelExists] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [showRegistration, setShowRegistration] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{ id: string; name: string; text: string }[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const [channelData, setChannelData] = useState({
    name: 'Loading...',
    description: 'Loading channel information...',
  });

  const [transcript, setTranscript] = useState('Welcome to the live stream!');
  const [currentMood, setCurrentMood] = useState('Happy');
  const [errorMessage, setErrorMessage] = useState('');

  // Helper function to validate UUID format
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Get current domain for sharing
  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://streamai.app'; // fallback
  };

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!channelId) {
        console.log('No channel ID provided');
        setIsLoading(false);
        setChannelExists(false);
        setErrorMessage('No channel ID provided in the URL');
        return;
      }

      console.log('Fetching channel data for ID:', channelId);

      // First validate if the channelId is a valid UUID format
      if (!isValidUUID(channelId)) {
        console.error('Invalid UUID format for channel ID:', channelId);
        setChannelExists(false);
        setIsLoading(false);
        setErrorMessage('Invalid channel ID format. Channel ID must be a valid UUID.');
        return;
      }

      try {
        // Check if channel exists using the correct UUID
        const { data: channel, error: channelError } = await supabase
          .from('channels')
          .select('*')
          .eq('id', channelId)
          .maybeSingle();

        if (channelError) {
          console.error('Database error fetching channel:', channelError);
          setChannelExists(false);
          setIsLoading(false);
          setErrorMessage(`Database error: ${channelError.message}`);
          return;
        }

        if (!channel) {
          console.log('Channel not found in database');
          setChannelExists(false);
          setIsLoading(false);
          setErrorMessage('Channel not found in our database');
          return;
        }

        console.log('Channel found:', channel);
        setChannelExists(true);
        setChannelData({
          name: channel.name || 'Unnamed Channel',
          description: channel.description || 'Live streaming channel',
        });
        setIsLive(channel.is_live || false);

        // Get current viewer count for this channel's live stream
        if (channel.is_live) {
          const { data: streams, error: streamsError } = await supabase
            .from('streams')
            .select('id, viewer_count')
            .eq('channel_id', channelId)
            .eq('is_live', true)
            .order('created_at', { ascending: false })
            .limit(1);

          if (streamsError) {
            console.error('Error fetching streams:', streamsError);
          } else if (streams && streams.length > 0) {
            setViewerCount(streams[0].viewer_count || 0);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Unexpected error fetching channel data:', error);
        setChannelExists(false);
        setIsLoading(false);
        setErrorMessage('An unexpected error occurred while loading the channel');
      }
    };

    fetchChannelData();
  }, [channelId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!showRegistration && channelExists) {
      const transcriptMessages = [
        "Let me show you how this AI mood detection works.",
        "It uses computer vision to analyze facial expressions.",
        "The speech recognition is another amazing feature we're using.",
        "Everything gets processed in real-time right in your browser.",
        "No servers needed for these AI features!",
        "What do you all think about these features?",
      ];
      
      let index = 0;
      const transcriptInterval = setInterval(() => {
        setTranscript(transcriptMessages[index % transcriptMessages.length]);
        index++;
      }, 5000);
      
      const moods = ['Happy', 'Neutral', 'Happy', 'Surprised', 'Neutral'];
      let moodIndex = 0;
      const moodInterval = setInterval(() => {
        setCurrentMood(moods[moodIndex % moods.length]);
        moodIndex++;
      }, 8000);
      
      const presetMessages = [
        { name: 'John', text: "This is amazing technology!" },
        { name: 'Emma', text: "How long did it take you to build this?" },
        { name: 'Alex', text: "The captions are working really well" },
        { name: 'Sophia', text: "Are you using TensorFlow.js for the mood detection?" },
        { name: 'Michael', text: "Can you explain how the WebRTC setup works?" },
      ];
      
      let msgIndex = 0;
      const chatInterval = setInterval(() => {
        if (Math.random() > 0.3) {
          const msg = presetMessages[msgIndex % presetMessages.length];
          setMessages(prev => [
            ...prev, 
            { id: Date.now().toString(), name: msg.name, text: msg.text }
          ]);
          msgIndex++;
        }
      }, 7000);
      
      return () => {
        clearInterval(transcriptInterval);
        clearInterval(moodInterval);
        clearInterval(chatInterval);
      };
    }
  }, [showRegistration, channelExists]);

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Register viewer in database if channel exists
    if (channelExists && channelId) {
      try {
        const { data: streams } = await supabase
          .from('streams')
          .select('id')
          .eq('channel_id', channelId)
          .eq('is_live', true)
          .limit(1);

        if (streams && streams.length > 0) {
          await supabase
            .from('viewers')
            .insert({
              stream_id: streams[0].id,
              first_name: firstName,
              last_name: lastName,
              email: email,
            });
        }
      } catch (error) {
        console.error('Error registering viewer:', error);
      }
    }
    
    toast({
      title: "Success!",
      description: "You're all set to watch the stream",
    });
    
    setShowRegistration(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      name: firstName,
      text: chatMessage,
    };
    
    setMessages([...messages, newMessage]);

    // Save message to database if channel exists
    if (channelExists && channelId) {
      try {
        const { data: streams } = await supabase
          .from('streams')
          .select('id')
          .eq('channel_id', channelId)
          .eq('is_live', true)
          .limit(1);

        if (streams && streams.length > 0) {
          await supabase
            .from('chat_messages')
            .insert({
              stream_id: streams[0].id,
              message: chatMessage,
            });
        }
      } catch (error) {
        console.error('Error saving chat message:', error);
      }
    }
    
    setChatMessage('');
  };

  const copyWatchLink = () => {
    const watchUrl = `${getCurrentDomain()}/watch/${channelId}`;
    navigator.clipboard.writeText(watchUrl);
    toast({
      title: "Link copied!",
      description: "Watch link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading channel...</div>
      </div>
    );
  }

  if (!channelExists) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Channel Not Found</h1>
          <p className="text-gray-300 mb-4">
            {errorMessage || "The channel you're looking for doesn't exist or may have been removed."}
          </p>
          <div className="bg-gray-800/50 p-3 rounded-lg mb-4 text-sm text-left">
            <p className="text-gray-400">Channel ID: <span className="text-white font-mono">{channelId}</span></p>
            {channelId && !isValidUUID(channelId) && (
              <p className="text-red-400 mt-2">
                ⚠️ Invalid UUID format. Channel IDs must be valid UUIDs.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="bg-purple-600 hover:bg-purple-700 w-full"
            >
              Go Back Home
            </Button>
            <div className="text-xs text-gray-400">
              <p>Correct URL format: {getCurrentDomain()}/watch/[valid-uuid]</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Registration Dialog */}
        <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
          <DialogContent className="bg-gray-900 border-purple-400/20">
            <DialogHeader>
              <DialogTitle className="text-white">Welcome to {channelData.name}</DialogTitle>
              <DialogDescription className="text-gray-300">
                Please provide your information to join the stream.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitRegistration}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="John"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 w-full">
                  Join Stream
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{channelData.name}</h1>
                <p className="text-gray-300">{channelData.description}</p>
              </div>
              <Button
                onClick={copyWatchLink}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10 flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Copy Watch Link
              </Button>
            </div>
            
            <div className="relative">
              {/* Video stream */}
              <div className="w-full rounded-lg bg-black aspect-video relative">
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <Video className="h-16 w-16 text-gray-600" />
                  <p className="text-gray-400 mt-2">
                    {isLive ? 'Live stream placeholder' : 'Stream is offline'}
                  </p>
                  {!isLive && (
                    <p className="text-gray-500 text-sm mt-1">
                      This channel is not currently streaming
                    </p>
                  )}
                </div>
                
                {/* Live badge */}
                {isLive && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className="bg-red-600 text-white px-2 py-1 rounded-md flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  </div>
                )}
                
                {/* Viewer count */}
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{viewerCount}</span>
                  </div>
                </div>

                {/* Mood indicator */}
                {isLive && (
                  <div className="absolute top-16 right-4">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md">
                      Mood: {currentMood === 'Happy' ? '😊' : currentMood === 'Sad' ? '😔' : '😐'} {currentMood}
                    </div>
                  </div>
                )}
                
                {/* Live captions */}
                {isLive && (
                  <div className="absolute bottom-8 left-0 right-0 mx-auto w-4/5 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-center">
                    {transcript}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" className="text-gray-300 hover:text-white space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Like</span>
                </Button>
                <Button variant="ghost" className="text-gray-300 hover:text-white space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
              <Button
                onClick={() => navigate('/')}
                variant="outline" 
                className="border-white/10 text-white hover:bg-white/10"
              >
                Exit Stream
              </Button>
            </div>
          </div>
          
          {/* Chat and Info */}
          <div className="w-full md:w-80">
            <Card className="bg-black/20 border-purple-400/20 backdrop-blur-sm mb-4">
              <CardHeader>
                <CardTitle className="text-white text-lg">Stream Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <div className={`px-2 py-0.5 rounded text-xs ${
                    isLive ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {isLive ? 'LIVE' : 'OFFLINE'}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Viewers:</span>
                  <span className="text-white">{viewerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Started:</span>
                  <span className="text-white">{isLive ? '12 minutes ago' : 'Not streaming'}</span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400">Share this stream:</p>
                  <p className="text-xs text-white font-mono break-all bg-gray-800/50 p-1 rounded mt-1">
                    {getCurrentDomain()}/watch/{channelId}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/20 border-purple-400/20 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center justify-between">
                  Live Chat
                  <span className="text-sm font-normal text-gray-300 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {messages.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={chatContainerRef} 
                  className="h-80 overflow-y-auto text-gray-300 bg-black/30 rounded-md p-3 mb-3"
                >
                  {messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.map(msg => (
                        <div key={msg.id} className="flex items-start space-x-2">
                          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <span className="text-white text-xs">{msg.name.charAt(0)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-white">{msg.name}</span>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      <p>Chat messages will appear here</p>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    disabled={showRegistration || !isLive}
                    className="flex-1 rounded-l-md py-2 px-3 bg-white/10 border-r-0 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none"
                  />
                  <Button 
                    type="submit" 
                    disabled={showRegistration || !isLive}
                    className="rounded-l-none bg-purple-600 hover:bg-purple-700"
                  >
                    Send
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
