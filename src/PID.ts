// https://gist.github.com/bradley219/5373998
class PIDImpl {
  private _pre_error = 0;
  private _integral = 0;
  public constructor(
    private readonly _dt: number,
    private readonly _max: number,
    private readonly _min: number,
    private readonly _Kp: number,
    private readonly _Kd: number,
    private readonly _Ki: number
  ) {}

  calculate(setpoint: number, pv: number) {
    // Calculate error
    const error = setpoint - pv;

    // Proportional term
    const Pout = this._Kp * error;

    // Integral term
    this._integral += error * this._dt;
    const Iout = this._Ki * this._integral;

    // Derivative term
    const derivative = (error - this._pre_error) / this._dt;
    const Dout = this._Kd * derivative;

    // Calculate total output
    let output = Pout + Iout + Dout;

    // Restrict to max/min
    if (output > this._max) {output = this._max;}
    else if (output < this._min) {output = this._min;}

    // Save error to previous error
    this._pre_error = error;

    return output;
  }
}

export class PID {
  private readonly pimpl: PIDImpl;

  // Kp -  proportional gain
  // Ki -  Integral gain
  // Kd -  derivative gain
  // dt -  loop interval time
  // max - maximum value of manipulated variable
  // min - minimum value of manipulated variable
  public constructor(
    dt: number,
    max: number,
    min: number,
    Kp: number,
    Kd: number,
    Ki: number
  ) {
    this.pimpl = new PIDImpl(dt, max, min, Kp, Kd, Ki);
  }

  // Returns the manipulated variable given a setpoint and current process value
  calculate(setpoint: number, pv: number) {
    // Setpoint : 目標値
    // pv : 現在の値
    return this.pimpl.calculate(setpoint, pv);
  }
}
