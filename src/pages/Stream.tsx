
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Users, Settings, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SpeechToText } from '@/components/SpeechToText';
import { MoodDetection } from '@/components/MoodDetection';

const Stream = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnable] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [mood, setMood] = useState<string>('Neutral');
  const [transcript, setTranscript] = useState<string>('');
  const streamTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Request camera and microphone permissions
    startPreview();

    return () => {
      stopPreview();
      if (streamTimer.current) {
        clearInterval(streamTimer.current);
      }
    };
  }, [user, navigate]);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const stopPreview = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const toggleStream = () => {
    if (isStreaming) {
      // Stop streaming
      setIsStreaming(false);
      if (streamTimer.current) {
        clearInterval(streamTimer.current);
      }
    } else {
      // Start streaming
      setIsStreaming(true);
      setStreamDuration(0);
      
      // Simulate viewer count increase
      const randomViewerIncrement = () => {
        setViewerCount(prev => Math.min(prev + Math.floor(Math.random() * 3), 100));
      };
      
      // Start stream duration timer
      streamTimer.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
        
        // Occasionally increase viewer count
        if (Math.random() > 0.8) {
          randomViewerIncrement();
        }
      }, 1000);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnable(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMoodChange = (detectedMood: string) => {
    setMood(detectedMood);
  };

  const handleTranscriptChange = (text: string) => {
    setTranscript(text);
  };

  const endStream = () => {
    setIsStreaming(false);
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">{user?.channelName}</h1>
                <p className="text-gray-300">Stream ID: {channelId}</p>
              </div>
              <Button 
                onClick={endStream} 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                End Stream
              </Button>
            </div>
            
            <div className="relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full rounded-lg bg-black aspect-video object-cover"
              />
              
              {/* Live badge */}
              {isStreaming && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <Badge className="bg-red-600 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                    LIVE
                  </Badge>
                </div>
              )}
              
              {/* Stream info overlay */}
              {isStreaming && (
                <div className="absolute top-4 right-4 flex items-center space-x-3">
                  <Badge className="bg-black/50 backdrop-blur-sm border-white/10">
                    <Clock className="h-4 w-4 mr-1 text-gray-300" />
                    {formatDuration(streamDuration)}
                  </Badge>
                  <Badge className="bg-black/50 backdrop-blur-sm border-white/10">
                    <Users className="h-4 w-4 mr-1 text-gray-300" />
                    {viewerCount}
                  </Badge>
                </div>
              )}
              
              {/* Mood detection overlay */}
              {isStreaming && (
                <div className="absolute top-16 right-4">
                  <Badge className="bg-black/50 backdrop-blur-sm border-white/10">
                    Mood: {mood === 'Happy' ? '😊' : mood === 'Sad' ? '😔' : '😐'} {mood}
                  </Badge>
                </div>
              )}
              
              {/* Captions */}
              {isStreaming && transcript && (
                <div className="absolute bottom-8 left-0 right-0 mx-auto w-4/5 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-center">
                  {transcript}
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  onClick={toggleStream} 
                  className={isStreaming ? "bg-gray-600 hover:bg-gray-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {isStreaming ? 'Stop Stream' : 'Start Stream'}
                </Button>
                <Button variant="outline" onClick={toggleVideo} className="border-white/10">
                  {isVideoEnabled ? <VideoOff className="h-4 w-4 mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                  {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
                </Button>
                <Button variant="outline" onClick={toggleAudio} className="border-white/10">
                  {isAudioEnabled ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isAudioEnabled ? 'Disable Audio' : 'Enable Audio'}
                </Button>
              </div>
              <Button variant="outline" className="border-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
          
          {/* Chat and Status */}
          <div className="w-full md:w-80">
            <Card className="bg-black/20 border-purple-400/20 backdrop-blur-sm mb-4">
              <CardHeader>
                <CardTitle className="text-white text-lg">Stream Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <Badge variant={isStreaming ? "destructive" : "secondary"} className={isStreaming ? "bg-red-600" : "bg-gray-600"}>
                    {isStreaming ? "LIVE" : "OFFLINE"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Viewers:</span>
                  <span className="text-white">{viewerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Duration:</span>
                  <span className="text-white">{formatDuration(streamDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Mood:</span>
                  <span className="text-white">{mood}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/20 border-purple-400/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 overflow-y-auto text-gray-300 bg-black/30 rounded-md p-3 mb-3">
                  {isStreaming ? (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs">JD</span>
                        </div>
                        <div>
                          <span className="font-semibold text-white">JohnDoe</span>
                          <p className="text-sm">Hey, great stream!</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                          <span className="text-white text-xs">AS</span>
                        </div>
                        <div>
                          <span className="font-semibold text-white">AliceSmith</span>
                          <p className="text-sm">Love the AI features!</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs">BT</span>
                        </div>
                        <div>
                          <span className="font-semibold text-white">BobTech</span>
                          <p className="text-sm">The transcription is working perfectly!</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">Chat available when streaming</p>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    disabled={!isStreaming}
                    className="flex-1 rounded-l-md py-2 px-3 bg-white/10 border-r-0 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none"
                  />
                  <Button disabled={!isStreaming} className="rounded-l-none bg-purple-600 hover:bg-purple-700">
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Hidden components that handle AI features */}
      {isStreaming && (
        <>
          <MoodDetection videoRef={videoRef} onMoodChange={handleMoodChange} />
          <SpeechToText isActive={isStreaming && isAudioEnabled} onTranscriptChange={handleTranscriptChange} />
        </>
      )}
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default Stream;
