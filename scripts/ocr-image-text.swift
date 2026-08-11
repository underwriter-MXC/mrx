import CoreGraphics
import Foundation
import ImageIO
import Vision

let jsonMode = CommandLine.arguments.count == 3 && CommandLine.arguments[1] == "--json"
let imagePath = jsonMode ? CommandLine.arguments[2] : CommandLine.arguments.dropFirst().first
guard let imagePath else {
  FileHandle.standardError.write(Data("usage: ocr-image-text [--json] <image-path>\n".utf8))
  exit(64)
}

let imageURL = URL(fileURLWithPath: imagePath) as CFURL
guard
  let source = CGImageSourceCreateWithURL(imageURL, nil),
  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
  FileHandle.standardError.write(Data("could not decode image\n".utf8))
  exit(65)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["en-US"]

do {
  try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
} catch {
  FileHandle.standardError.write(Data("vision OCR failed: \(error)\n".utf8))
  exit(70)
}

let observations = (request.results ?? []).sorted { lhs, rhs in
  let verticalDelta = lhs.boundingBox.midY - rhs.boundingBox.midY
  if abs(verticalDelta) > 0.02 { return verticalDelta > 0 }
  return lhs.boundingBox.minX < rhs.boundingBox.minX
}
let lines = observations.compactMap { $0.topCandidates(1).first?.string }
if jsonMode {
  let payload: [[String: Any]] = observations.compactMap { observation in
    guard let candidate = observation.topCandidates(1).first else { return nil }
    return [
      "text": candidate.string,
      "confidence": candidate.confidence,
      "x": observation.boundingBox.minX,
      "y": observation.boundingBox.minY,
      "width": observation.boundingBox.width,
      "height": observation.boundingBox.height,
    ]
  }
  do {
    let data = try JSONSerialization.data(withJSONObject: payload, options: [])
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data("\n".utf8))
  } catch {
    FileHandle.standardError.write(Data("could not encode OCR JSON: \(error)\n".utf8))
    exit(70)
  }
} else {
  print(lines.joined(separator: "\n"))
}
