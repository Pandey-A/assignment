"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '@mantine/dropzone';
import { Button, NumberInput, Group, Stack, Text, ActionIcon } from '@mantine/core';
import { Upload, Play, Pause, Trash2, RotateCcw, Plus } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [mediaSelected, setMediaSelected] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [timeRange, setTimeRange] = useState({ start: 0, end: 5 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMediaVisible, setIsMediaVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleDrop = (files: File[]) => {
    const uploadedFile = files[0];
    setFile(uploadedFile);
    const url = URL.createObjectURL(uploadedFile);
    setPreview(url);
    setIsVideo(uploadedFile.type.startsWith('video/'));
    setCurrentTime(0);
    setPosition({ x: 0, y: 0 });
    setIsMediaVisible(true);
    if (isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRef.current && 'pause' in mediaRef.current) {
        (mediaRef.current as HTMLVideoElement).pause();
      }
      setIsPlaying(false);
    } else {
      setCurrentTime(timeRange.start);
      setIsMediaVisible(true);
      if (mediaRef.current instanceof HTMLVideoElement) {
        mediaRef.current.currentTime = timeRange.start;
        mediaRef.current.play();
      }
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= timeRange.end) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            if (mediaRef.current instanceof HTMLVideoElement) {
              mediaRef.current.pause();
            }
            setIsPlaying(false);
            setIsMediaVisible(false);
            return timeRange.start;
          }
          return prev + 0.1;
        });
      }, 100);
      setIsPlaying(true);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPlaying(false);
    setCurrentTime(timeRange.start);
    setIsMediaVisible(true);
    if (mediaRef.current instanceof HTMLVideoElement) {
      mediaRef.current.currentTime = timeRange.start;
      mediaRef.current.pause();
    }
  };

  const removeMedia = () => {
    setFile(null);
    setPreview('');
    setIsVideo(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setPosition({ x: 0, y: 0 });
    setIsMediaVisible(true);
  };

  const handleMediaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - position.x;
      const offsetY = e.clientY - rect.top - position.y;
      
      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
      setMediaSelected(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      const maxX = rect.width - dimensions.width;
      const maxY = rect.height - dimensions.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResize = (handle: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (handle) {
        case 'top-left':
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(100, startHeight - deltaY);
          break;
        case 'top-right':
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(100, startHeight - deltaY);
          break;
        case 'bottom-left':
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(100, startHeight + deltaY);
          break;
        case 'bottom-right':
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(100, startHeight + deltaY);
          break;
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMediaSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-2">
          <Text size="xl" fw={600}>Video Editor</Text>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="light">Save Draft</Button>
          <Button>Done</Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r p-6">
          <Stack gap="xl">
            <div>
              <Text size="sm" fw={500} mb={4}>Dimensions</Text>
              <Group grow>
                <NumberInput
                  label="Width"
                  value={dimensions.width}
                  onChange={(val) => setDimensions(prev => ({ ...prev, width: Number(val) || 400 }))}

                  min={100}
                  max={1920}
                />
                <NumberInput
                  label="Height"
                  value={dimensions.height}
                  onChange={(val) => setDimensions(prev => ({ ...prev, height: Number(val) || 300 }))}
                  min={100}
                  max={1080}
                />
              </Group>
            </div>

            <div>
              <Text size="sm" fw={500} mb={4}>Time Range</Text>
              <Group grow>
                <NumberInput
                  label="Start Time (s)"
                  value={timeRange.start}
                  onChange={(val) => setTimeRange(prev => ({ ...prev, start: Number(val) || 0 }))}
                  min={0}
                  decimalScale={1}
                />
                <NumberInput
                  label="End Time (s)"
                  value={timeRange.end}
                  onChange={(val) => setTimeRange(prev => ({ ...prev, start: Number(val) || 5 }))}
                  min={timeRange.start}
                  decimalScale={1}
                />
              </Group>
            </div>

            <Group>
            <Button
  onClick={togglePlayback}
  leftSection={<span className="play-icon">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</span>}
  variant="filled"
  color="blue"
  fullWidth
>
  {isPlaying ? 'Pause' : 'Play'}
</Button>

              <ActionIcon
                variant="light"
                color="gray"
                onClick={resetTimer}
                size="lg"
              >
                <RotateCcw size={20} />
              </ActionIcon>
            </Group>

            <Text ta="center" size="sm" c="dimmed">
              Current Time: {currentTime.toFixed(1)}s
            </Text>

            {file && (
              <Button
                onClick={removeMedia}
                leftSection={<Trash2 size={20} />}
                variant="light"
                color="red"
              >
                Remove Media
              </Button>
            )}
          </Stack>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-[#000000] p-8">
          <div 
            ref={containerRef} 
            className="relative h-full flex items-center justify-center overflow-hidden"
          >
            {!file ? (
              <Dropzone
                onDrop={handleDrop}
                accept={['image/*', 'video/*']}
                className="w-96 h-96 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg bg-[#111111]"
              >
                <Stack align="center" gap="xs">
                  <Upload size={40} className="text-gray-400" />
                  <Text size="xl" fw={500} c="gray.4">Drop media here</Text>
                  <Text size="sm" c="dimmed">or click to upload</Text>
                  <Button variant="light" leftSection={<Plus size={20} />} mt="md">
                    Add Media
                  </Button>
                </Stack>
              </Dropzone>
            ) : (
              isMediaVisible && (
                <div 
                  className="absolute cursor-move"
                  style={{
                    left: position.x,
                    top: position.y,
                  }}
                  onMouseDown={handleMediaMouseDown}
                >
                  {isVideo ? (
                    <video
                      ref={mediaRef as React.RefObject<HTMLVideoElement>}
                      src={preview}
                      style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <img
                      ref={mediaRef as React.RefObject<HTMLImageElement>}
                      src={preview}
                      alt="Preview"
                      style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  {mediaSelected && (
                    <div 
                      className="media-resizer absolute top-0 left-0"
                      style={{
                        width: dimensions.width,
                        height: dimensions.height,
                      }}
                    >
                      {['top', 'right', 'bottom', 'left', 
                        'top-left', 'top-right', 
                        'bottom-left', 'bottom-right'].map((handle) => (
                        <div
                          key={handle}
                          className={`media-resizer-handle media-resizer-handle-${handle}`}
                          onMouseDown={(e) => handleResize(handle, e)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}