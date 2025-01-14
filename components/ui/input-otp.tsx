"use client"

import * as React from "react"
import OtpInput from 'react-otp-input'
import { cn } from "@/lib/utils"

interface InputOTPProps extends React.ComponentProps<typeof OtpInput> {
  className?: string
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex gap-2", className)}>
        <OtpInput
          containerStyle="flex gap-2"
          inputStyle={{
            width: "40px",
            height: "40px",
            margin: "0 4px",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
          }}
          {...props}
        />
      </div>
    )
  }
)
InputOTP.displayName = "InputOTP"

export { InputOTP }
