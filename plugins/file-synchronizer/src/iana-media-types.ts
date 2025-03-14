export namespace MediaTypes {
  export type FileType = 'document' | 'image' | 'audio' | 'video' | 'other'

  const MEDIA_TYPE_TO_FILE_TYPE = {
    'application/pdf': 'document',
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'application/vnd.ms-excel': 'document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
    'application/vnd.ms-powerpoint': 'document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  } as const satisfies { [key: string]: FileType }

  export const mediaTypeToFileType = (mediaType: string | undefined): FileType =>
    mediaType === undefined
      ? 'other'
      : mediaType.startsWith('image/')
        ? 'image'
        : mediaType.startsWith('audio/')
          ? 'audio'
          : mediaType.startsWith('video/')
            ? 'video'
            : mediaType.startsWith('text/')
              ? 'document'
              : mediaType in MEDIA_TYPE_TO_FILE_TYPE
                ? MEDIA_TYPE_TO_FILE_TYPE[mediaType as keyof typeof MEDIA_TYPE_TO_FILE_TYPE]
                : 'other'
}
